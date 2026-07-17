// src/routes/goal.routes.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { goalController } from '../controllers/goal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

router.get('/', goalController.getGoals);
router.post('/auto-calculate', goalController.autoCalculate);

router.get(
  '/progress',
  [
    query('startDate').matches(/^\d{4}-\d{2}-\d{2}$/),
    query('endDate').matches(/^\d{4}-\d{2}-\d{2}$/),
  ],
  validate,
  goalController.getGoalProgressRange
);

router.get(
  '/progress/:date',
  [param('date').matches(/^\d{4}-\d{2}-\d{2}$/)],
  validate,
  goalController.getGoalProgress
);

router.put(
  '/',
  [
    body('targetCalories').isFloat({ min: 800, max: 6000 }),
    body('targetProtein').isFloat({ min: 20, max: 500 }),
    body('targetCarbs').isFloat({ min: 20, max: 800 }),
    body('targetFats').isFloat({ min: 10, max: 300 }),
    body('targetWeight').optional().isFloat({ min: 20, max: 500 }),
    body('targetWaterIntake').optional().isFloat({ min: 0.5, max: 10 }),
    body('fitnessGoal').optional().isIn(['muscle_gain', 'fat_loss', 'lean_bulk', 'maintenance']),
  ],
  validate,
  goalController.setGoals
);

// Kept for backward compatibility with any existing POST-based callers
router.post(
  '/',
  [
    body('targetCalories').isFloat({ min: 800, max: 6000 }),
    body('targetProtein').isFloat({ min: 20, max: 500 }),
    body('targetCarbs').isFloat({ min: 20, max: 800 }),
    body('targetFats').isFloat({ min: 10, max: 300 }),
    body('targetWeight').optional().isFloat({ min: 20, max: 500 }),
    body('targetWaterIntake').optional().isFloat({ min: 0.5, max: 10 }),
    body('fitnessGoal').optional().isIn(['muscle_gain', 'fat_loss', 'lean_bulk', 'maintenance']),
  ],
  validate,
  goalController.setGoals
);

export default router;
