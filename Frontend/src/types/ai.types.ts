// types/ai.types.ts — DietPlan, MealSuggestion interfaces

export type DietBudget = 'basic' | 'standard' | 'premium';
export type DietType = 'veg' | 'non_veg' | 'eggetarian' | 'vegan';
export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintenance';

export interface GenerateDietPayload {
  fitnessGoal: FitnessGoal;
  dietType: DietType;
  budget: DietBudget;
  allergies: string[];
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

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];    // Quick reply chips
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
