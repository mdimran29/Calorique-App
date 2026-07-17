// src/controllers/ai.controller.ts
import { Request, Response } from 'express';
import { aiService, DietGenerationInput } from '../services/ai.service';
import { userRepository } from '../repositories/user.repository';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

// Map frontend display labels → internal values
const GOAL_MAP: Record<string, string> = {
  'Muscle Gain': 'muscle_gain', 'muscle_gain': 'muscle_gain',
  'Fat Loss':    'fat_loss',    'fat_loss':    'fat_loss',
  'Lean Bulk':   'lean_bulk',   'lean_bulk':   'lean_bulk',
  'Maintenance': 'maintain',    'maintain':    'maintain',
};

const DIET_MAP: Record<string, string> = {
  'Veg':        'veg',        'veg':        'veg',
  'Non-Veg':    'non_veg',   'non_veg':    'non_veg',
  'Eggetarian': 'eggetarian', 'eggetarian': 'eggetarian',
  'Vegan':      'vegan',      'vegan':      'vegan',
};

const BUDGET_MAP: Record<string, string> = {
  'Basic':    'low',    'low':    'low',    'basic':    'low',
  'Standard': 'medium', 'medium': 'medium', 'standard': 'medium',
  'Premium':  'high',   'high':   'high',   'premium':  'high',
};

export const aiController = {
  generateDiet: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const body   = req.body;

    // Pull user profile from DB to fill in missing biometrics
    const user = await userRepository.findById(userId);

    // Normalise goal / diet / budget from either frontend or legacy format
    const rawGoal = body.fitnessGoal ?? body.goal ?? user?.goal ?? 'muscle_gain';
    const rawDiet = body.dietType   ?? body.foodPreference ?? user?.foodPreference ?? 'veg';
    const rawBudget = body.budget   ?? user?.budget ?? 'medium';

    const input: DietGenerationInput = {
      age:            body.age           ?? user?.age           ?? 25,
      gender:         body.gender        ?? user?.gender        ?? 'male',
      height:         body.height        ?? user?.height        ?? 170,
      weight:         body.weight        ?? user?.weight        ?? 70,
      goal:           GOAL_MAP[rawGoal]  ?? rawGoal,
      activityLevel:  body.activityLevel ?? user?.activityLevel ?? 'moderate',
      foodPreference: DIET_MAP[rawDiet]  ?? rawDiet,
      budget:         BUDGET_MAP[rawBudget] ?? rawBudget,
      budgetAmountInr: body.budgetAmountInr ? Number(body.budgetAmountInr) : undefined,
      allergies:      body.allergies     ?? user?.allergies     ?? [],
      mealsPerDay:    body.mealsPerDay   ?? 4,
      notes:          body.notes,
      // Pass through frontend-selected values to the prompt
      fitnessGoalLabel: rawGoal,
      dietTypeLabel:    rawDiet,
      budgetLabel:      rawBudget,
      durationDays:     body.durationDays ?? 7,
    };

    logger.info('Generating diet plan', { userId, goal: input.goal, diet: input.foodPreference });

    const result = await aiService.generateDietPlan(userId, input);
    sendSuccess(res, { plan: result.plan, dietPlanId: result.dietPlanId }, 'Diet plan generated successfully');
  }),

  mealSuggestions: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user   = await userRepository.findById(userId);

    const input = {
      remainingCalories: req.body.remainingCalories ?? 600,
      remainingProtein:  req.body.remainingProtein  ?? 40,
      remainingCarbs:    req.body.remainingCarbs    ?? 60,
      remainingFats:     req.body.remainingFats     ?? 20,
      mealType:          req.body.mealType          ?? 'lunch',
      foodPreference:    req.body.foodPreference    ?? user?.foodPreference ?? 'veg',
    };

    const suggestions = await aiService.getMealSuggestions(userId, input);
    sendSuccess(res, { suggestions }, 'Meal suggestions generated');
  }),

  getLatestPlan: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const dietPlan = await aiService.getLatestDietPlan(userId);
    sendSuccess(res, { dietPlan });
  }),

  getDietPlanById: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { planId } = req.params;
    const dietPlan = await aiService.getDietPlanById(userId, planId);
    sendSuccess(res, { dietPlan });
  }),

  listDietPlans: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const dietPlans = await aiService.listDietPlans(userId);
    sendSuccess(res, { dietPlans });
  }),

  sendChatMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { message, conversationId, context } = req.body;
    const result = await aiService.chatWithAria(userId, message, conversationId, context);
    sendSuccess(res, result, 'Message sent successfully');
  }),

  getChatHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { conversationId } = req.query;
    const history = await aiService.getChatHistory(userId, conversationId as string | undefined);
    sendSuccess(res, history, 'Chat history retrieved successfully');
  }),
};
