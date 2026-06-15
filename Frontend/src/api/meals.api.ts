// api/meals.api.ts — getMeals(), createMeal(), updateMeal(), deleteMeal()

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, DateRangeParams } from '../types/api.types';
import type { Meal, DailyMealSummary, CreateMealPayload, UpdateMealPayload } from '../types/meal.types';

export interface GetMealsParams extends DateRangeParams {
  date?: string;          // Single day filter: YYYY-MM-DD
  mealType?: string;
  page?: number;
  pageSize?: number;
}

export const mealsApi = {
  /**
   * Get meals — can filter by date, date range, or meal type
   */
  getMeals: (params?: GetMealsParams) =>
    apiClient
      .get<ApiResponse<Meal[]>>('/meals', { params })
      .then((r) => r.data),

  /**
   * Search for food items
   */
  searchFood: (query: string) =>
    apiClient.get<ApiResponse<{ results: any[] }>>(`/meals/search?q=${query}`).then((r) => r.data),

  /**
   * Get today's daily summary (all meals + macros totals)
   */
  getDailySummary: (date: string) =>
    apiClient
      .get<ApiResponse<DailyMealSummary>>(`/meals/summary/${date}`)
      .then((r) => r.data),

  /**
   * Get a single meal by ID
   */
  getMealById: (id: string) =>
    apiClient.get<ApiResponse<Meal>>(`/meals/${id}`).then((r) => r.data),

  /**
   * Create a new meal entry
   */
  createMeal: (payload: CreateMealPayload) =>
    apiClient.post<ApiResponse<Meal>>('/meals', payload).then((r) => r.data),

  /**
   * Update an existing meal
   */
  updateMeal: ({ id, ...payload }: UpdateMealPayload) =>
    apiClient.put<ApiResponse<Meal>>(`/meals/${id}`, payload).then((r) => r.data),

  /**
   * Delete a meal
   */
  deleteMeal: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/meals/${id}`).then((r) => r.data),

  /**
   * Log water intake for a specific date
   */
  logWater: (date: string, glasses: number) =>
    apiClient
      .post<ApiResponse<{ glasses: number }>>('/meals/water', { date, glasses })
      .then((r) => r.data),

  /**
   * Get meal history (paginated)
   */
  getMealHistory: (params?: DateRangeParams & { page?: number; pageSize?: number }) =>
    apiClient
      .get<PaginatedResponse<DailyMealSummary>>('/meals/history', { params })
      .then((r) => r.data),
};
