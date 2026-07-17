// src/utils/validateEnv.ts — Fail fast on missing required config at boot
import { logger } from './logger';

const REQUIRED = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'FIREBASE_PROJECT_ID',
] as const;

const RECOMMENDED = [
  'GEMINI_API_KEY',
  'SPOONACULAR_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Cannot start: missing required environment variables — ${missing.join(', ')}`);
  }

  const missingRecommended = RECOMMENDED.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    logger.warn(
      `Missing optional environment variables (related features will be degraded): ${missingRecommended.join(', ')}`
    );
  }

  if (process.env.NODE_ENV === 'production') {
    if ((process.env.JWT_ACCESS_SECRET?.length ?? 0) < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
    }
    if ((process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters in production');
    }
    if (!process.env.FRONTEND_URL) {
      logger.warn('FRONTEND_URL is not set — CORS will only allow localhost origins in production');
    }
  }
}
