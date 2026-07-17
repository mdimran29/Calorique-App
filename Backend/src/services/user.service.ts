// src/services/user.service.ts
import { userRepository } from '../repositories/user.repository';
import { mealRepository } from '../repositories/meal.repository';
import { progressRepository } from '../repositories/progress.repository';
import { goalRepository } from '../repositories/goal.repository';
import { Meal } from '../models/Meal.model';
import { Progress } from '../models/Progress.model';
import { RefreshToken } from '../models/RefreshToken.model';
import { DietPlan } from '../models/DietPlan.model';
import { ChatMessage } from '../models/ChatMessage.model';
import { User } from '../models/User.model';
import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { calculateStreaks } from '../utils/streakCalculator';

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const [{ meals: allMeals }, progress, goal] = await Promise.all([
      mealRepository.findByUserId(userId, 1, 100000),
      progressRepository.findByUserId(userId),
      goalRepository.findByUserId(userId),
    ]);

    const loggedDays = allMeals.filter((m) => m.dailyTotals?.calories > 0).map((m) => m.date);
    const { currentStreak } = calculateStreaks(loggedDays);

    const mealsLogged = allMeals.reduce((sum, m) => sum + (m.meals?.length ?? 0), 0);

    const calorieGoal = goal?.targetCalories;
    const goalsHit = calorieGoal
      ? (progress?.calorieHistory ?? []).filter((e) => e.calories > 0 && e.calories <= calorieGoal).length
      : 0;

    // Keep the persisted streak in sync so other reads (e.g. auth/me) stay consistent
    if (user.streak !== currentStreak) {
      await userRepository.updateById(userId, { streak: currentStreak, lastActiveDate: new Date() });
    }

    return {
      ...user,
      streak: currentStreak,
      daysActive: loggedDays.length,
      mealsLogged,
      goalsHit,
    };
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    // Check profile completeness
    const updates = { ...data } as any;
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const merged = { ...user, ...updates };
    updates.profileComplete = !!(
      merged.age && merged.height && merged.weight && merged.goal && merged.activityLevel
    );

    return userRepository.updateById(userId, updates);
  },

  async updateSettings(userId: string, settings: Record<string, unknown>) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    const merged = { ...user.settings, ...settings };
    const updated = await userRepository.updateById(userId, { settings: merged as any });
    return updated?.settings;
  },

  async deleteAccount(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    await Promise.all([
      Meal.deleteMany({ userId }),
      Progress.deleteOne({ userId }),
      goalRepository.deleteByUserId(userId),
      RefreshToken.deleteMany({ userId }),
      DietPlan.deleteMany({ userId }),
      ChatMessage.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);
  },

  async uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'calorique/avatars',
          public_id: `avatar_${userId}`,
          overwrite: true,
          resource_type: 'image',
          format: 'webp',
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        async (err, result) => {
          if (err || !result) {
            logger.error('Cloudinary upload error', err);
            return reject(ApiError.internal('Failed to upload image'));
          }
          await userRepository.updateById(userId, { avatar: result.secure_url });
          resolve(result.secure_url);
        }
      );
      stream.end(fileBuffer);
    });
  },
};
