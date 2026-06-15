// types/meal.types.ts — Meal, FoodItem, MealEntry interfaces

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Macros {
  calories: number;
  protein: number;   // grams
  carbs: number;     // grams
  fat: number;       // grams
  fiber?: number;    // grams
}

export interface FoodItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  _id: string;
  type: string;
  foods: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  loggedAt: string;
}

export interface DailyMealSummary {
  _id: string;
  userId: string;
  date: string;
  meals: Meal[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface CreateMealPayload {
  date?: string;
  type: string;
  foods: FoodItem[];
}

export interface UpdateMealPayload {
  id: string;
  type?: string;
  foods?: FoodItem[];
}
