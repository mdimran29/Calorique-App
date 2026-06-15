// src/utils/macroCalculator.ts — BMR/TDEE/macro calculation utilities

export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor Equation
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  return Math.round(bmr * multiplier);
}

export function calculateMacros(tdee: number, goal: string) {
  const adjustments: Record<string, { calorieAdj: number; protein: number; carbs: number; fats: number }> = {
    muscle_gain: { calorieAdj: +300, protein: 0.35, carbs: 0.40, fats: 0.25 },
    fat_loss:    { calorieAdj: -500, protein: 0.40, carbs: 0.30, fats: 0.30 },
    lean_bulk:   { calorieAdj: +200, protein: 0.30, carbs: 0.45, fats: 0.25 },
    maintain:    { calorieAdj: 0,    protein: 0.30, carbs: 0.40, fats: 0.30 },
  };

  const adj = adjustments[goal] ?? adjustments['maintain'];
  const calories = Math.round(tdee + adj.calorieAdj);

  return {
    targetCalories: calories,
    targetProtein:  Math.round((calories * adj.protein) / 4),
    targetCarbs:    Math.round((calories * adj.carbs) / 4),
    targetFats:     Math.round((calories * adj.fats) / 9),
  };
}
