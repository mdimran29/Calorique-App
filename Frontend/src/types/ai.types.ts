// types/ai.types.ts — DietPlan, MealSuggestion interfaces

export type DietBudget = 'basic' | 'standard' | 'premium';
// Free-text now — covers the fixed presets (veg, non_veg, ...) as well as custom entries (e.g. "Jain", "Keto")
export type DietType = string;
export type FitnessGoal = string;

export interface GenerateDietPayload {
  fitnessGoal: FitnessGoal;
  dietType: DietType;
  budget?: DietBudget;
  /** Real daily food budget in rupees — takes priority over `budget` tier when set */
  budgetAmountInr?: number;
  allergies: string[];
  /** Free-text notes for anything not covered by the fixed fields */
  notes?: string;
  dailyCalorieTarget?: number;
  durationDays?: number;     // default 7
  cuisinePreference?: string; // e.g., 'indian'
}

export interface PlanMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe?: string;
  estimatedCost?: number;
}

export interface DayPlan {
  day: string;               // 'Monday', 'Tuesday', etc.
  breakfast: PlanMeal;
  lunch: PlanMeal;
  dinner: PlanMeal;
  snack: PlanMeal;
  totalCalories: number;
  totalProtein: number;
}

export interface DietPlan {
  id: string;
  userId: string;
  title: string;
  fitnessGoal: FitnessGoal;
  dietType: DietType;
  budget: DietBudget;
  days: DayPlan[];
  weeklyCalorieAvg: number;
  weeklyProteinAvg: number;
  tips: string[];
  generatedAt: string;
  expiresAt?: string;
}

export interface MealSuggestion {
  id: string;
  name: string;
  reason: string;         // Why AI suggested this
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatFoodSuggestion {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];    // Quick reply chips
  foodSuggestions?: ChatFoodSuggestion[]; // Specific foods Aria recommended — can be logged directly
}

export interface SendMessagePayload {
  message: string;
  conversationId?: string;
  context?: {
    currentGoal?: FitnessGoal;
    dietType?: DietType;
    recentMeals?: string[];
  };
}
