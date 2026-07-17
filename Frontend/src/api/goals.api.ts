// api/goals.api.ts — getGoals(), setGoals()

import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type { NutritionGoal, GoalProgress, SetGoalPayload } from '../types/goal.types';

export const goalsApi = {
  /**
   * Get the current user's active nutrition goal
   */
  getGoals: () =>
    apiClient
      .get<ApiResponse<{ goals: NutritionGoal }>>('/goals')
      .then((r) => ({ ...r.data, data: r.data.data.goals })),

  /**
   * Create or update the user's nutrition goals
   */
  setGoals: (payload: SetGoalPayload) =>
    apiClient
      .put<ApiResponse<{ goals: NutritionGoal }>>('/goals', payload)
      .then((r) => ({ ...r.data, data: r.data.data.goals })),

  /**
   * Auto-calculate goals from the user's profile (BMR/TDEE based)
   */
  autoCalculateGoals: () =>
    apiClient
      .post<ApiResponse<{ goals: NutritionGoal }>>('/goals/auto-calculate')
      .then((r) => ({ ...r.data, data: r.data.data.goals })),

  /**
   * Get goal progress for a specific date
   */
  getGoalProgress: (date: string) =>
    apiClient
      .get<ApiResponse<GoalProgress>>(`/goals/progress/${date}`)
      .then((r) => r.data),

  /**
   * Get goal progress for a date range
   */
  getGoalProgressRange: (startDate: string, endDate: string) =>
    apiClient
      .get<ApiResponse<GoalProgress[]>>('/goals/progress', {
        params: { startDate, endDate },
      })
      .then((r) => r.data),
};
