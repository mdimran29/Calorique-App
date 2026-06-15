// store/mealStore.ts — Current day meal cache for offline support

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Meal, DailyMealSummary, MealType } from '../types/meal.types';
import { today } from '../utils/dateUtils';
import { sumMacros } from '../utils/macroUtils';

interface MealStore {
  // State
  /** Date currently being viewed: YYYY-MM-DD */
  currentDate: string;
  /** Cached meals by date key */
  mealsByDate: Record<string, Meal[]>;
  /** Water glasses by date */
  waterByDate: Record<string, number>;
  /** Offline queue of meal mutations */
  offlineQueue: Array<{
    id: string;
    type: 'create' | 'update' | 'delete';
    payload: unknown;
    timestamp: string;
  }>;

  // Actions
  setCurrentDate: (date: string) => void;
  setCachedMeals: (date: string, meals: Meal[]) => void;
  addMealToCache: (date: string, meal: Meal) => void;
  removeMealFromCache: (date: string, mealId: string) => void;
  setWater: (date: string, glasses: number) => void;
  getDailySummary: (date: string) => DailyMealSummary | null;
  addToOfflineQueue: (item: MealStore['offlineQueue'][0]) => void;
  removeFromOfflineQueue: (id: string) => void;
  clearOfflineQueue: () => void;
}

export const useMealStore = create<MealStore>()(
  persist(
    (set, get) => ({
      currentDate:  today(),
      mealsByDate:  {},
      waterByDate:  {},
      offlineQueue: [],

      setCurrentDate: (date) => set({ currentDate: date }),

      setCachedMeals: (date, meals) =>
        set((state) => ({
          mealsByDate: { ...state.mealsByDate, [date]: meals },
        })),

      addMealToCache: (date, meal) =>
        set((state) => ({
          mealsByDate: {
            ...state.mealsByDate,
            [date]: [...(state.mealsByDate[date] ?? []), meal],
          },
        })),

      removeMealFromCache: (date, mealId) =>
        set((state) => ({
          mealsByDate: {
            ...state.mealsByDate,
            [date]: (state.mealsByDate[date] ?? []).filter((m) => m._id !== mealId),
          },
        })),

      setWater: (date, glasses) =>
        set((state) => ({
          waterByDate: { ...state.waterByDate, [date]: glasses },
        })),

      getDailySummary: (date) => {
        const meals = get().mealsByDate[date];
        if (!meals) return null;
        const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0);
        return {
          _id: date,
          userId: 'local',
          date,
          meals,
          dailyTotals: {
            calories: totalCalories,
            protein: meals.reduce((s, m) => s + m.totalProtein, 0),
            carbs: meals.reduce((s, m) => s + m.totalCarbs, 0),
            fats: meals.reduce((s, m) => s + m.totalFats, 0),
          },
        } as DailyMealSummary;
      },

      addToOfflineQueue: (item) =>
        set((state) => ({ offlineQueue: [...state.offlineQueue, item] })),

      removeFromOfflineQueue: (id) =>
        set((state) => ({
          offlineQueue: state.offlineQueue.filter((q) => q.id !== id),
        })),

      clearOfflineQueue: () => set({ offlineQueue: [] }),
    }),
    {
      name:    'calorique-meals',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentDate:  state.currentDate,
        mealsByDate:  state.mealsByDate,
        waterByDate:  state.waterByDate,
        offlineQueue: state.offlineQueue,
      }),
    }
  )
);

// Helper selector
export const selectTodayMeals = (state: MealStore) =>
  state.mealsByDate[state.currentDate] ?? [];

export const selectMealsByType = (state: MealStore, type: MealType) =>
  (state.mealsByDate[state.currentDate] ?? []).filter((m) => m.type === type);
