// src/services/user.service.ts
import { userRepository } from '../repositories/user.repository';
import { cloudinary } from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const userService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
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
