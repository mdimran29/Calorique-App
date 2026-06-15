// src/services/meal.service.ts
import { mealRepository } from '../repositories/meal.repository';
import { progressRepository } from '../repositories/progress.repository';
import { IFoodItem } from '../models/Meal.model';
import { ApiError } from '../utils/ApiError';
import { Types } from 'mongoose';
import { format } from 'date-fns';

function computeTotals(foods: IFoodItem[]) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein:  acc.protein + f.protein,
      carbs:    acc.carbs + f.carbs,
      fats:     acc.fats + f.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export const mealService = {
  async getMeals(userId: string, query: { date?: string; page?: number; limit?: number; startDate?: string; endDate?: string }) {
    const { date, page = 1, limit = 10, startDate, endDate } = query;

    if (startDate && endDate) {
      const meals = await mealRepository.findByDateRange(userId, startDate, endDate);
      return { meals, total: meals.length };
    }

    const targetDate = date ?? format(new Date(), 'yyyy-MM-dd');

    if (date) {
      const meal = await mealRepository.findByUserAndDate(userId, targetDate);
      return { meals: meal ? [meal] : [], total: meal ? 1 : 0 };
    }

    return mealRepository.findByUserId(userId, page, limit);
  },

  async logMeal(userId: string, payload: { date?: string; type: string; foods: IFoodItem[] }) {
    const date = payload.date ?? format(new Date(), 'yyyy-MM-dd');
    const foodTotals = computeTotals(payload.foods);

    const newEntry = {
      type:          payload.type,
      foods:         payload.foods,
      totalCalories: foodTotals.calories,
      totalProtein:  foodTotals.protein,
      totalCarbs:    foodTotals.carbs,
      totalFats:     foodTotals.fats,
      loggedAt:      new Date(),
    };

    // Upsert meal document for this date
    const existingMeal = await mealRepository.findByUserAndDate(userId, date);
    let updatedMeals;

    if (existingMeal) {
      updatedMeals = [...existingMeal.meals, newEntry];
    } else {
      updatedMeals = [newEntry];
    }

    // Recompute daily totals
    const allFoods = updatedMeals.flatMap(m => m.foods);
    const dailyTotals = computeTotals(allFoods);

    const meal = await mealRepository.upsertByDate(userId, date, {
      meals: updatedMeals as any,
      dailyTotals,
    });

    // Update calorie history in progress
    await progressRepository.pushCalorieEntry(new Types.ObjectId(userId), {
      date,
      calories: dailyTotals.calories,
    });

    return meal;
  },

  async updateMeal(userId: string, mealId: string, payload: { type?: string; foods?: IFoodItem[] }) {
    const mealDoc = await mealRepository.findById(mealId);
    if (!mealDoc) throw ApiError.notFound('Meal not found');
    if (mealDoc.userId.toString() !== userId) throw ApiError.forbidden();

    // Find the entry inside meals array and update
    const entryIndex = mealDoc.meals.findIndex(m => m._id?.toString() === mealId);
    // Update the top-level doc
    if (payload.foods) {
      const foodTotals = computeTotals(payload.foods);
      const allMeals = mealDoc.meals.map(m =>
        m._id?.toString() === mealId
          ? { ...m, foods: payload.foods, ...foodTotals }
          : m
      );
      const dailyTotals = computeTotals(allMeals.flatMap(m => (m.foods ?? []) as IFoodItem[]));
      return mealRepository.upsertByDate(userId, mealDoc.date, {
        meals: allMeals as any,
        dailyTotals,
      });
    }
    return mealDoc;
  },

  async deleteMeal(userId: string, mealId: string) {
    const mealDoc = await mealRepository.findById(mealId);
    if (!mealDoc) throw ApiError.notFound('Meal not found');
    if (mealDoc.userId.toString() !== userId) throw ApiError.forbidden();
    await mealRepository.deleteById(mealId);
  },
};
