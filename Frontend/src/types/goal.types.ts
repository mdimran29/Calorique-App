// types/goal.types.ts — Goal interface

export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintenance';

export interface NutritionGoal {
  _id?: string;
  userId: string;
  targetCalories: number;
  targetProtein: number;     // grams
  targetCarbs: number;       // grams
  targetFats: number;        // grams
  targetWeight?: number;
  targetWaterIntake: number; // liters
  fitnessGoal?: FitnessGoal;
  createdAt: string;
  updatedAt: string;
}

export interface GoalProgress {
  date: string;
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  carbsConsumed: number;
  carbsGoal: number;
  fatConsumed: number;
  fatGoal: number;
  waterGlasses: number;
  waterGoal: number;
  achieved: boolean;
}

export interface SetGoalPayload {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFats: number;
  targetWeight?: number;
  targetWaterIntake?: number;
  fitnessGoal?: FitnessGoal;
}
