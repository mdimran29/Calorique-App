// src/server.ts — HTTP server entry point
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import app from './app';
import { connectDB } from './config/db';
import { initFirebase } from './config/firebase';
import { initCloudinary } from './config/cloudinary';
import { logger } from './utils/logger';
import { validateEnv } from './utils/validateEnv';

const PORT = process.env.PORT ?? 5000;

async function start() {
  try {
    validateEnv();

    // Initialize services
    initFirebase();
    initCloudinary();
    await connectDB();

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`🚀 Calorique API running on http://localhost:${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV ?? 'development'}`);
      logger.info(`📡 Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', err);
  process.exit(1);
});

start();
