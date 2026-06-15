// src/config/cloudinary.ts — Cloudinary configuration
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';

export function initCloudinary(): void {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  logger.info('✅ Cloudinary configured');
}

export { cloudinary };
