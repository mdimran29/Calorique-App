// src/routes/progress.routes.ts
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { progressController } from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

router.get('/', progressController.getProgress);
router.get('/analytics', progressController.getAnalytics);

router.post(
  '/weight',
  [body('weight').isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20-500 kg')],
  validate,
  progressController.logWeight
);

router.post(
  '/water',
  [body('liters').isFloat({ min: 0.1, max: 10 }).withMessage('Water must be between 0.1-10 liters')],
  validate,
  progressController.logWater
);

// Nutrition search
router.get('/nutrition/search', progressController.searchFood);
router.get('/nutrition/:id', progressController.getFoodDetails);
router.get('/nutrition/barcode/:barcode', progressController.getBarcode);

export default router;
