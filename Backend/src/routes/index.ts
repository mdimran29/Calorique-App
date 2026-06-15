// src/routes/index.ts — Route aggregator
import { Router } from 'express';
import authRoutes     from './auth.routes';
import mealRoutes     from './meal.routes';
import goalRoutes     from './goal.routes';
import aiRoutes       from './ai.routes';
import userRoutes     from './user.routes';
import progressRoutes from './progress.routes';

const router = Router();

router.use('/auth',     authRoutes);
router.use('/meals',    mealRoutes);
router.use('/goals',    goalRoutes);
router.use('/ai',       aiRoutes);
router.use('/users',    userRoutes);
router.use('/progress', progressRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Calorique API is running ✅', timestamp: new Date().toISOString() });
});

export default router;
