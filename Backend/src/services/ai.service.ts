// src/services/ai.service.ts — Gemini AI prompt builder + response parser
import { getGeminiModel, getGeminiClient } from '../config/gemini';
import { dietPlanRepository } from '../repositories/dietPlan.repository';
import { chatMessageRepository } from '../repositories/chatMessage.repository';
import { userRepository } from '../repositories/user.repository';
import { mealRepository } from '../repositories/meal.repository';
import { goalRepository } from '../repositories/goal.repository';
import { ApiError } from '../utils/ApiError';
import { calculateBMR, calculateTDEE } from '../utils/macroCalculator';
import { logger } from '../utils/logger';
import { format } from 'date-fns';

export interface DietGenerationInput {
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  activityLevel: string;
  foodPreference: string;
  budget?: string;
  /** Real daily food budget in rupees, e.g. 350. Takes priority over the `budget` tier label when set. */
  budgetAmountInr?: number;
  allergies?: string[];
  mealsPerDay?: number;
  /** Free-text notes for anything not covered by the fixed fields (custom goal, custom diet, medical notes, etc.) */
  notes?: string;
  // Human-readable labels from the frontend UI
  fitnessGoalLabel?: string;
  dietTypeLabel?: string;
  budgetLabel?: string;
  durationDays?: number;
}

export const aiService = {
  async generateDietPlan(userId: string, input: DietGenerationInput) {
    const bmr  = calculateBMR(input.weight, input.height, input.age, input.gender);
    const tdee = calculateTDEE(bmr, input.activityLevel);

    const prompt = buildDietPrompt(input, tdee);

    try {
      const model    = getGeminiModel('gemini-2.5-flash-lite'); // lite = ~5s vs 68s for 2.5-flash
      const result   = await model.generateContent(prompt);
      const text     = result.response.text();
      const plan     = parseDietResponse(text);
      const dietPlan = await dietPlanRepository.create(userId, plan);
      return { plan, dietPlanId: dietPlan._id };
    } catch (err: any) {
      logger.error('Gemini diet generation failed', err);
      throw ApiError.serviceUnavailable('AI service temporarily unavailable');
    }
  },

  async getMealSuggestions(userId: string, input: {
    remainingCalories: number;
    remainingProtein: number;
    remainingCarbs: number;
    remainingFats: number;
    mealType: string;
    foodPreference: string;
  }) {
    const prompt = `
You are an expert Indian nutritionist. Suggest 3 meal options for ${input.mealType}.

Remaining nutritional targets:
- Calories: ${input.remainingCalories} kcal
- Protein: ${input.remainingProtein}g
- Carbs: ${input.remainingCarbs}g
- Fats: ${input.remainingFats}g
- Food preference: ${input.foodPreference}

Return JSON array of 3 meals:
[{
  "name": "meal name",
  "description": "brief description",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "foods": [{ "name": string, "quantity": string, "calories": number }]
}]
Return ONLY valid JSON, no markdown.`;

    try {
      const model  = getGeminiModel('gemini-2.5-flash');
      const result = await model.generateContent(prompt);
      const text   = result.response.text().trim();
      const clean  = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(clean);
    } catch (err: any) {
      logger.error('Gemini meal suggestions failed', err);
      throw ApiError.serviceUnavailable('AI service temporarily unavailable');
    }
  },

  async getLatestDietPlan(userId: string) {
    const plan = await dietPlanRepository.findLatestByUserId(userId);
    if (!plan) throw ApiError.notFound('No diet plan found. Generate one first.');
    return plan;
  },

  async getDietPlanById(userId: string, planId: string) {
    const plans = await dietPlanRepository.findAllByUserId(userId);
    const plan = plans.find((p) => p._id.toString() === planId);
    if (!plan) throw ApiError.notFound('Diet plan not found.');
    return plan;
  },

  async listDietPlans(userId: string) {
    return dietPlanRepository.findAllByUserId(userId);
  },

  async getChatHistory(userId: string, conversationId?: string) {
    const messages = await chatMessageRepository.findHistory(userId, conversationId);
    return messages.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    }));
  },

  async chatWithAria(userId: string, messageText: string, conversationId?: string, context?: any) {
    // 1. Save user message in DB
    const userMsg = await chatMessageRepository.create(userId, 'user', messageText, conversationId);

    // 2. Fetch recent conversation history to maintain context
    const rawHistory = await chatMessageRepository.findHistory(userId, conversationId);
    // Limit history length to last 15 messages for Gemini context efficiency
    const recentHistory = rawHistory.slice(-15);

    // 3. Get user details + today's real macro progress for grounded, proactive coaching
    const today = format(new Date(), 'yyyy-MM-dd');
    const [user, goal, todaysMeal] = await Promise.all([
      userRepository.findById(userId),
      goalRepository.findByUserId(userId),
      mealRepository.findByUserAndDate(userId, today),
    ]);

    let systemInstruction = `You are Aria, a friendly, professional, and knowledgeable AI Dietitian and fitness coach for Calorique. You help users with meal planning, nutrition advice, calorie and macro tracking, and workouts. Your recommendations should be highly practical, emphasizing Indian foods where relevant, and customized to the user's specific fitness goals. Keep your responses concise, encouraging, and formatted in clear, readable markdown with emojis. Reference the user's actual remaining macros for today when relevant instead of speaking generically.
Always respond with a JSON object containing these fields:
- "reply": a string (using markdown format) containing your coaching response to the user.
- "suggestions": an array of 2 to 3 short strings, representing relevant follow-up query chips/quick suggestions the user might want to click next.
- "foodSuggestions": OPTIONAL array (only include when you're recommending specific foods/meals to eat) of objects: {"name": string, "quantity": string (e.g. "100g" or "2 pieces"), "calories": number, "protein": number, "carbs": number, "fats": number}. Keep quantities realistic and Indian-market-common. Omit this field entirely if you aren't recommending specific food items in this reply.
`;

    if (user) {
      systemInstruction += `\n\nUser Profile Context:
- Name: ${user.name}
- Age: ${user.age || 'Not set'}
- Gender: ${user.gender || 'Not set'}
- Height: ${user.height ? user.height + 'cm' : 'Not set'}
- Weight: ${user.weight ? user.weight + 'kg' : 'Not set'}
- Goal: ${user.goal || 'Not set'}
- Food Preference: ${user.foodPreference || 'Not set'}
- Allergies: ${user.allergies?.join(', ') || 'None'}
- Budget Preference: ${user.budget || 'medium'}`;
    }

    if (goal) {
      const eaten = todaysMeal?.dailyTotals ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
      systemInstruction += `\n\nToday's Progress (${today}):
- Calories: ${Math.round(eaten.calories)} / ${goal.targetCalories} kcal eaten (${Math.max(0, Math.round(goal.targetCalories - eaten.calories))} kcal remaining)
- Protein: ${Math.round(eaten.protein)}g / ${goal.targetProtein}g (${Math.max(0, Math.round(goal.targetProtein - eaten.protein))}g remaining)
- Carbs: ${Math.round(eaten.carbs)}g / ${goal.targetCarbs}g (${Math.max(0, Math.round(goal.targetCarbs - eaten.carbs))}g remaining)
- Fats: ${Math.round(eaten.fats)}g / ${goal.targetFats}g (${Math.max(0, Math.round(goal.targetFats - eaten.fats))}g remaining)`;
    }

    if (context) {
      systemInstruction += `\n\nAdditional Session Context:
- Current Goal: ${context.currentGoal || 'None'}
- Diet Type: ${context.dietType || 'None'}
- Recent Meals: ${context.recentMeals?.join(', ') || 'None'}`;
    }

    try {
      const model = getGeminiClient().getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
        systemInstruction,
      });

      // Format history for Gemini API. Exclude the last user message because we pass it as the new content.
      const geminiHistory = recentHistory.slice(0, -1).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({
        history: geminiHistory,
      });

      const result = await chat.sendMessage(messageText);
      const replyText = result.response.text().trim();

      let parsedReply: {
        reply: string;
        suggestions: string[];
        foodSuggestions?: Array<{ name: string; quantity: string; calories: number; protein: number; carbs: number; fats: number }>;
      } = {
        reply: '',
        suggestions: [],
      };

      try {
        parsedReply = JSON.parse(replyText);
      } catch (parseErr) {
        logger.warn('Failed to parse Gemini structured JSON response, falling back to raw response', parseErr);
        parsedReply = {
          reply: replyText,
          suggestions: [
            'Suggest high-protein snacks',
            'Modify dinner to be cheaper',
            'Create a pre-workout meal',
          ],
        };
      }

      // 4. Save Aria's message in DB
      // We store the clean "reply" content in DB so next turns don't get polluted by raw JSON format
      const assistantMsg = await chatMessageRepository.create(
        userId,
        'assistant',
        parsedReply.reply,
        conversationId
      );

      return {
        message: {
          id: assistantMsg._id.toString(),
          role: 'assistant' as const,
          content: parsedReply.reply,
          timestamp: assistantMsg.createdAt.toISOString(),
        },
        suggestions: parsedReply.suggestions,
        foodSuggestions: parsedReply.foodSuggestions ?? [],
      };
    } catch (err: any) {
      const errMsg = err?.message ?? String(err);
      const errStatus = err?.status ?? err?.statusCode ?? 'unknown';
      const errBody = err?.errorDetails ?? err?.response?.data ?? err?.body ?? {};
      logger.error(`Gemini chat failed [${errStatus}]: ${errMsg} | detail: ${JSON.stringify(errBody)}`);
      throw ApiError.serviceUnavailable('Aria is temporarily offline. Please try again in a moment.');
    }
  },
};

function buildDietPrompt(input: DietGenerationInput, tdee: number): string {
  const days    = Math.min(input.durationDays ?? 3, 3); // cap at 3 days for speed
  const names   = ['Monday','Tuesday','Wednesday'].slice(0, days);
  const goal    = input.fitnessGoalLabel ?? input.goal;
  const diet    = input.dietTypeLabel    ?? input.foodPreference;
  const allergy = input.allergies?.length ? input.allergies.join(', ') : 'None';

  // A real ₹/day amount always wins over the coarse tier label — it lets the model
  // pick specific, price-appropriate Indian foods instead of a vague "budget-friendly" gloss.
  const budget = input.budgetAmountInr
    ? `₹${input.budgetAmountInr}/day (must keep the day's ingredient cost within this)`
    : (input.budgetLabel ?? input.budget ?? 'standard');

  // Calorie target based on goal
  const calMap: Record<string,number> = {
    muscle_gain: tdee + 250, 'Muscle Gain': tdee + 250,
    fat_loss:    tdee - 400, 'Fat Loss':    tdee - 400,
    lean_bulk:   tdee + 150, 'Lean Bulk':   tdee + 150,
    maintain:    tdee,       'Maintenance': tdee,
  };
  const targetCal = calMap[input.goal] ?? calMap[goal] ?? tdee;

  return `Indian nutritionist AI. Return ONLY valid JSON, no markdown.

User: ${input.age}y ${input.gender}, ${input.weight}kg, ${input.height}cm, ${input.activityLevel}
Goal: ${goal} | Diet: ${diet} | Budget: ${budget} | Avoid: ${allergy}
Target: ${targetCal} kcal/day
${input.notes ? `Additional notes from user (follow closely — may include custom goals, diet styles, or medical/preference details not covered above): ${input.notes}\n` : ''}
Generate a ${days}-day Indian meal plan for days: ${names.join(', ')}.
Each day: breakfast (8am), lunch (1pm), snack (4pm), dinner (8pm).
Each meal: 2-3 foods maximum. Keep foods simple and common in India.
${input.budgetAmountInr ? `Include an "estimatedCost" number (in ₹) on each meal reflecting realistic Indian market prices for the ingredients used.\n` : ''}

Schema (return exactly this structure):
{
  "title": "${days}-Day ${goal} ${diet} Plan",
  "dailyCalories": ${targetCal},
  "macros": {"protein": number, "carbs": number, "fats": number},
  "waterIntake": "2.5 liters",
  "fitnessGoal": "${goal}",
  "dietType": "${diet}",
  "budget": "${budget}",
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "time": "8:00 AM",
          "name": "Meal name",
          "foods": [{"name": "food", "quantity": "100g", "calories": 150, "protein": 10, "carbs": 20, "fats": 5}],
          "mealCalories": 400,
          "mealProtein": 25,
          "mealCarbs": 40,
          "mealFats": 12${input.budgetAmountInr ? ',\n          "estimatedCost": 45' : ''}
        }
      ],
      "totalCalories": ${targetCal},
      "totalProtein": number${input.budgetAmountInr ? ',\n      "totalEstimatedCost": number' : ''}
    }
  ],
  "tips": ["tip1", "tip2"],
  "supplements": ["supplement1"]
}`;
}

function parseDietResponse(text: string): object {
  try {
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    throw ApiError.internal('Failed to parse AI response');
  }
}
