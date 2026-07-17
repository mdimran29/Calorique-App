// src/routes/meal.routes.ts
import { Router } from 'express';
import { body, param } from 'express-validator';
import { mealController } from '../controllers/meal.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

const foodItemValidation = [
  body('foods').isArray({ min: 1 }).withMessage('At least one food item required'),
  body('foods.*.name').notEmpty().withMessage('Food name required'),
  body('foods.*.quantity').isFloat({ min: 0.1 }),
  body('foods.*.unit').notEmpty(),
  body('foods.*.calories').isFloat({ min: 0 }),
  body('foods.*.protein').isFloat({ min: 0 }),
  body('foods.*.carbs').isFloat({ min: 0 }),
  body('foods.*.fats').isFloat({ min: 0 }),
];

router.get('/search', mealController.searchFood);
router.get('/history', mealController.getMealHistory);
router.get(
  '/summary/:date',
  [param('date').matches(/^\d{4}-\d{2}-\d{2}$/)],
  validate,
  mealController.getDailySummary
);

router.post(
  '/water',
  [
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('glasses').isInt({ min: 0, max: 30 }),
  ],
  validate,
  mealController.logWater
);

router.get('/', mealController.getMeals);

router.post(
  '/',
  [
    body('type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    ...foodItemValidation,
  ],
  validate,
  mealController.createMeal
);

router.get(
  '/:id',
  [param('id').isMongoId()],
  validate,
  mealController.getMealById
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('foods').optional().isArray({ min: 1 }),
  ],
  validate,
  mealController.updateMeal
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  validate,
  mealController.deleteMeal
);

export default router;
