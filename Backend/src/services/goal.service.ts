// src/services/goal.service.ts
import { goalRepository } from '../repositories/goal.repository';
import { userRepository } from '../repositories/user.repository';
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
};
