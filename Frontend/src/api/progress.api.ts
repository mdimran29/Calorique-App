// api/progress.api.ts — getProgress(), logWeight()

import apiClient from './client';
import type { ApiResponse, PaginatedResponse, DateRangeParams } from '../types/api.types';

export interface WeightEntry {
  id: string;
  userId: string;
  weightKg: number;
  date: string;       // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface CalorieHistoryEntry {
  date: string;
  caloriesConsumed: number;
  caloriesGoal: number;
  goalAchieved: boolean;
}

export interface ProgressSummary {
  weightEntries: WeightEntry[];
  calorieHistory: CalorieHistoryEntry[];
  currentStreak: number;
  longestStreak: number;
  totalWeightLost: number;    // kg
  avgDailyCalories: number;
  goalsHitCount: number;
  totalDaysLogged: number;
}

export interface LogWeightPayload {
  weightKg: number;
  date: string;
  notes?: string;
}

export const progressApi = {
  /**
   * Get full progress summary for the current user
   */
  getProgress: (params?: DateRangeParams) =>
    apiClient
      .get<ApiResponse<ProgressSummary>>('/progress', { params })
      .then((r) => r.data),

  /**
   * Log a weight measurement
   */
  logWeight: (payload: LogWeightPayload) =>
    apiClient
      .post<ApiResponse<WeightEntry>>('/progress/weight', payload)
      .then((r) => r.data),

  /**
   * Get weight history (paginated)
   */
  getWeightHistory: (params?: DateRangeParams & { page?: number; pageSize?: number }) =>
    apiClient
      .get<PaginatedResponse<WeightEntry>>('/progress/weight', { params })
      .then((r) => r.data),

  /**
   * Get calorie history for charting (last N days)
   */
  getCalorieHistory: (days = 30) =>
    apiClient
      .get<ApiResponse<CalorieHistoryEntry[]>>('/progress/calories', { params: { days } })
      .then((r) => r.data),

  /**
   * Delete a weight entry
   */
  deleteWeightEntry: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/progress/weight/${id}`).then((r) => r.data),
};
