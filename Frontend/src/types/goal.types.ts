// types/goal.types.ts — Goal interface

export interface NutritionGoal {
  id: string;
  userId: string;
  dailyCalories: number;
  dailyProtein: number;      // grams
  dailyCarbs: number;        // grams
  dailyFat: number;          // grams
  dailyFiber?: number;       // grams
  dailyWaterGlasses: number;
  targetWeightKg: number;
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintenance';
  weeklyWeightGoalKg?: number;   // e.g. -0.5 for 0.5kg loss/week
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
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyWaterGlasses: number;
  targetWeightKg: number;
  fitnessGoal: NutritionGoal['fitnessGoal'];
}
