// api/user.api.ts — getProfile(), updateProfile(), uploadAvatar()

import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type { User, UserProfile, UserStats, UserSettings } from '../types/user.types';

export interface UpdateProfilePayload extends Partial<Omit<UserProfile, 'userId'>> {
  displayName?: string;
}

export const userApi = {
  /**
   * Get the current authenticated user's full data
   */
  getProfile: () =>
    apiClient
      .get<ApiResponse<any>>('/users/profile')
      .then((r) => {
        const u = r.data.data?.user ?? r.data.data;
        return {
          user: u,
          profile: {
            age: u?.age,
            gender: u?.gender,
            heightCm: u?.height,
            weightKg: u?.weight,
            targetWeightKg: u?.targetWeight,
            activityLevel: u?.activityLevel,  // already in backend enum format
            fitnessGoal: u?.goal,             // backend stores as 'goal'
            dietType: u?.foodPreference,
          },
          stats: {
            currentStreak: u?.streak || 0,
            daysActive: u?.daysActive || 0,
            mealsLogged: u?.mealsLogged || 0,
            goalsHit: u?.goalsHit || 0,
          }
        };
      }),

  /**
   * Update user profile fields
   */
  updateProfile: (payload: UpdateProfilePayload) => {
    // Only send defined fields to avoid overwriting with undefined
    const raw: Record<string, unknown> = {};
    if (payload.displayName !== undefined) raw.name           = payload.displayName;
    if (payload.age          !== undefined) raw.age           = payload.age;
    if (payload.gender       !== undefined) raw.gender        = payload.gender;
    if (payload.heightCm     !== undefined) raw.height        = payload.heightCm;
    if (payload.weightKg     !== undefined) raw.weight        = payload.weightKg;
    if (payload.targetWeightKg !== undefined) raw.targetWeight = payload.targetWeightKg;
    if (payload.activityLevel !== undefined) raw.activityLevel = payload.activityLevel;
    if (payload.fitnessGoal  !== undefined) raw.goal          = payload.fitnessGoal;
    if (payload.dietType     !== undefined) raw.foodPreference = payload.dietType;
    return apiClient
      .put<ApiResponse<any>>('/users/profile', raw)
      .then((r) => r.data);
  },

  /**
   * Upload a profile avatar image
   */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient
      .post<ApiResponse<{ avatarUrl: string }>>('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  /**
   * Update app settings (theme, notifications, etc.)
   */
  updateSettings: (settings: Partial<UserSettings>) =>
    apiClient
      .put<ApiResponse<UserSettings>>('/users/settings', settings)
      .then((r) => r.data),

  /**
   * Delete account
   */
  deleteAccount: () =>
    apiClient.delete<ApiResponse<null>>('/users/profile').then((r) => r.data),
};
