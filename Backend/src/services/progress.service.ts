// src/services/progress.service.ts
import { progressRepository } from '../repositories/progress.repository';
import { mealRepository } from '../repositories/meal.repository';
import { ApiError } from '../utils/ApiError';
import { format, subDays } from 'date-fns';

export const progressService = {
  async getProgress(userId: string) {
    const progress = await progressRepository.findByUserId(userId);
    if (!progress) return { weightHistory: [], calorieHistory: [], waterHistory: [] };
    return progress;
  },

  async logWeight(userId: string, weight: number) {
    const date = format(new Date(), 'yyyy-MM-dd');
    return progressRepository.pushWeightEntry(userId, { weight, date });
  },

  async logWater(userId: string, liters: number) {
    const date = format(new Date(), 'yyyy-MM-dd');
    return progressRepository.pushWaterEntry(userId, { date, liters });
  },

  async getAnalytics(userId: string, days = 30) {
    const endDate   = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const [progress, meals] = await Promise.all([
      progressRepository.findByUserId(userId),
      mealRepository.findByDateRange(userId, startDate, endDate),
    ]);

    if (!progress) throw ApiError.notFound('No progress data found');

    // Weekly calorie average
    const calHistory = progress.calorieHistory
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalCals = calHistory.reduce((s, e) => s + e.calories, 0);
    const avgCalories = calHistory.length ? Math.round(totalCals / calHistory.length) : 0;

    // Weight trend
    const weightHistory = (progress.weightHistory ?? [])
      .filter(e => e.date >= startDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      calorieHistory: calHistory,
      weightHistory,
      waterHistory: (progress.waterHistory ?? []).filter(e => e.date >= startDate),
      averageCalories: avgCalories,
      mealsLogged: meals.length,
      period: { startDate, endDate, days },
    };
  },
};
