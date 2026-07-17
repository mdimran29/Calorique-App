// src/services/progress.service.ts
import { progressRepository } from '../repositories/progress.repository';
import { mealRepository } from '../repositories/meal.repository';
import { goalRepository } from '../repositories/goal.repository';
import { ApiError } from '../utils/ApiError';
import { calculateStreaks } from '../utils/streakCalculator';
import { format, subDays } from 'date-fns';

function toWeightEntry(userId: string, e: any) {
  return {
    id: String(e._id),
    userId,
    weightKg: e.weight,
    date: e.date,
    notes: e.notes ?? undefined,
    createdAt: e._id?.getTimestamp?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export const progressService = {
  async getProgress(userId: string, startDate?: string, endDate?: string) {
    const [progress, goal, mealDays] = await Promise.all([
      progressRepository.findByUserId(userId),
      goalRepository.findByUserId(userId),
      mealRepository.findByDateRange(userId, startDate ?? '0000-01-01', endDate ?? '9999-12-31'),
    ]);

    const weightHistory = (progress?.weightHistory ?? [])
      .filter((e) => (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => toWeightEntry(userId, e));

    const calorieGoal = goal?.targetCalories ?? 2000;
    const calorieHistory = (progress?.calorieHistory ?? [])
      .filter((e) => (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((e) => ({
        date: e.date,
        caloriesConsumed: e.calories,
        caloriesGoal: calorieGoal,
        goalAchieved: e.calories > 0 && e.calories <= calorieGoal,
      }));

    const loggedDates = mealDays.filter((m) => m.dailyTotals?.calories > 0).map((m) => m.date);
    const { currentStreak, longestStreak } = calculateStreaks(loggedDates);

    const totalWeightLost =
      weightHistory.length >= 2
        ? Math.round((weightHistory[weightHistory.length - 1].weightKg - weightHistory[0].weightKg) * -1 * 10) / 10
        : 0;

    const avgDailyCalories = calorieHistory.length
      ? Math.round(calorieHistory.reduce((s, e) => s + e.caloriesConsumed, 0) / calorieHistory.length)
      : 0;

    const goalsHitCount = calorieHistory.filter((e) => e.goalAchieved).length;

    return {
      weightEntries: weightHistory,
      calorieHistory,
      currentStreak,
      longestStreak,
      totalWeightLost,
      avgDailyCalories,
      goalsHitCount,
      totalDaysLogged: loggedDates.length,
    };
  },

  async logWeight(userId: string, weightKg: number, date?: string, notes?: string) {
    const entryDate = date ?? format(new Date(), 'yyyy-MM-dd');
    const progress = await progressRepository.pushWeightEntry(userId, { weight: weightKg, date: entryDate, notes });
    const entry = progress.weightHistory.find((e) => e.date === entryDate);
    return toWeightEntry(userId, entry ?? { weight: weightKg, date: entryDate, notes, _id: null });
  },

  async deleteWeightEntry(userId: string, entryId: string) {
    const progress = await progressRepository.deleteWeightEntry(userId, entryId);
    if (!progress) throw ApiError.notFound('Weight entry not found');
    return null;
  },

  async getWeightHistory(userId: string, page = 1, pageSize = 90) {
    const progress = await progressRepository.findByUserId(userId);
    const all = (progress?.weightHistory ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize).map((e) => toWeightEntry(userId, e));
    return { items, total: all.length, page, pageSize };
  },

  async logWater(userId: string, liters: number) {
    const date = format(new Date(), 'yyyy-MM-dd');
    return progressRepository.pushWaterEntry(userId, { date, liters });
  },

  async getCalorieHistory(userId: string, days = 30) {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
    const [progress, goal] = await Promise.all([
      progressRepository.findByUserId(userId),
      goalRepository.findByUserId(userId),
    ]);
    const calorieGoal = goal?.targetCalories ?? 2000;

    // Fill every day in range so charts don't have gaps for unlogged days
    const byDate = new Map((progress?.calorieHistory ?? []).map((e) => [e.date, e.calories]));
    const result: { date: string; caloriesConsumed: number; caloriesGoal: number; goalAchieved: boolean }[] = [];
    for (let i = 0; i < days; i++) {
      const d = format(subDays(new Date(), days - 1 - i), 'yyyy-MM-dd');
      const consumed = byDate.get(d) ?? 0;
      result.push({ date: d, caloriesConsumed: consumed, caloriesGoal: calorieGoal, goalAchieved: consumed > 0 && consumed <= calorieGoal });
    }
    return result;
  },

  async getAnalytics(userId: string, days = 30) {
    const endDate   = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

    const [progress, meals] = await Promise.all([
      progressRepository.findByUserId(userId),
      mealRepository.findByDateRange(userId, startDate, endDate),
    ]);

    if (!progress) {
      return {
        calorieHistory: [], weightHistory: [], waterHistory: [],
        averageCalories: 0, mealsLogged: 0, period: { startDate, endDate, days },
      };
    }

    const calHistory = progress.calorieHistory
      .filter(e => e.date >= startDate && e.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalCals = calHistory.reduce((s, e) => s + e.calories, 0);
    const avgCalories = calHistory.length ? Math.round(totalCals / calHistory.length) : 0;

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
