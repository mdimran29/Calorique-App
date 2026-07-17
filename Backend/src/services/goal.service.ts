// src/services/goal.service.ts
import { goalRepository } from '../repositories/goal.repository';
import { userRepository } from '../repositories/user.repository';
import { mealRepository } from '../repositories/meal.repository';
import { calculateBMR, calculateTDEE, calculateMacros } from '../utils/macroCalculator';
import { ApiError } from '../utils/ApiError';

export const goalService = {
  async getGoals(userId: string) {
    const goals = await goalRepository.findByUserId(userId);
    if (!goals) throw ApiError.notFound('No goals set yet');
    return goals;
  },

  async setGoals(
    userId: string,
    payload: {
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFats: number;
      targetWeight?: number;
      targetWaterIntake?: number;
      fitnessGoal?: 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintenance';
    }
  ) {
    return goalRepository.upsert(userId, { ...payload, userId: userId as any });
  },

  async autoCalculateGoals(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (!user.weight || !user.height || !user.age || !user.gender || !user.activityLevel || !user.goal) {
      throw ApiError.badRequest('Complete your profile first to auto-calculate goals');
    }

    const bmr  = calculateBMR(user.weight, user.height, user.age, user.gender);
    const tdee = calculateTDEE(bmr, user.activityLevel);
    const macros = calculateMacros(tdee, user.goal);

    return goalRepository.upsert(userId, { ...macros, userId: userId as any });
  },

  async getGoalProgress(userId: string, date: string) {
    const [goal, meal] = await Promise.all([
      goalRepository.findByUserId(userId),
      mealRepository.findByUserAndDate(userId, date),
    ]);
    if (!goal) throw ApiError.notFound('No goals set yet');

    const totals = meal?.dailyTotals ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const waterGlasses = (meal as any)?.waterGlasses ?? 0;
    const waterGoalGlasses = Math.round((goal.targetWaterIntake ?? 3) / 0.25);

    return {
      date,
      caloriesConsumed: Math.round(totals.calories),
      caloriesGoal: goal.targetCalories,
      proteinConsumed: Math.round(totals.protein * 10) / 10,
      proteinGoal: goal.targetProtein,
      carbsConsumed: Math.round(totals.carbs * 10) / 10,
      carbsGoal: goal.targetCarbs,
      fatConsumed: Math.round(totals.fats * 10) / 10,
      fatGoal: goal.targetFats,
      waterGlasses,
      waterGoal: waterGoalGlasses,
      achieved: totals.calories > 0 && totals.calories <= goal.targetCalories,
    };
  },

  async getGoalProgressRange(userId: string, startDate: string, endDate: string) {
    const [goal, meals] = await Promise.all([
      goalRepository.findByUserId(userId),
      mealRepository.findByDateRange(userId, startDate, endDate),
    ]);
    if (!goal) throw ApiError.notFound('No goals set yet');

    const waterGoalGlasses = Math.round((goal.targetWaterIntake ?? 3) / 0.25);
    const byDate = new Map(meals.map((m) => [m.date, m]));

    const dates: string[] = [];
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().slice(0, 10));
    }

    return dates.map((date) => {
      const meal = byDate.get(date);
      const totals = meal?.dailyTotals ?? { calories: 0, protein: 0, carbs: 0, fats: 0 };
      return {
        date,
        caloriesConsumed: Math.round(totals.calories),
        caloriesGoal: goal.targetCalories,
        proteinConsumed: Math.round(totals.protein * 10) / 10,
        proteinGoal: goal.targetProtein,
        carbsConsumed: Math.round(totals.carbs * 10) / 10,
        carbsGoal: goal.targetCarbs,
        fatConsumed: Math.round(totals.fats * 10) / 10,
        fatGoal: goal.targetFats,
        waterGlasses: (meal as any)?.waterGlasses ?? 0,
        waterGoal: waterGoalGlasses,
        achieved: totals.calories > 0 && totals.calories <= goal.targetCalories,
      };
    });
  },
};
