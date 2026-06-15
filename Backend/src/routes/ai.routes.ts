// src/routes/ai.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { aiController } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate);

// ── Generate Diet Plan ──────────────────────────────────────────────────
// Accepts both legacy field names (age/gender/goal) AND new frontend shape
// (fitnessGoal/dietType/budget) — the controller normalises them.
router.post(
  '/generate-diet',
  [
    // New frontend format (preferred)
    body('fitnessGoal')
      .optional()
      .isIn(['muscle_gain', 'fat_loss', 'lean_bulk', 'maintenance', 'Muscle Gain', 'Fat Loss', 'Lean Bulk', 'Maintenance']),
    body('dietType')
      .optional()
      .isIn(['veg', 'non_veg', 'eggetarian', 'vegan', 'Veg', 'Non-Veg', 'Eggetarian']),
    body('budget')
      .optional()
      .isIn(['basic', 'standard', 'premium', 'Basic', 'Standard', 'Premium', 'low', 'medium', 'high']),
    body('allergies').optional().isArray(),
    body('durationDays').optional().isInt({ min: 1, max: 30 }),
    // Legacy fields still accepted
    body('age').optional().isInt({ min: 13, max: 120 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('height').optional().isFloat({ min: 50, max: 300 }),
    body('weight').optional().isFloat({ min: 20, max: 500 }),
    body('activityLevel').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    body('mealsPerDay').optional().isInt({ min: 3, max: 6 }),
  ],
  validate,
  aiController.generateDiet
);

// ── Meal Suggestions ────────────────────────────────────────────────────
router.post(
  '/meal-suggestions',
  [
    body('remainingCalories').optional().isFloat({ min: 0 }),
    body('remainingProtein').optional().isFloat({ min: 0 }),
    body('remainingCarbs').optional().isFloat({ min: 0 }),
    body('remainingFats').optional().isFloat({ min: 0 }),
    body('mealType').optional().isString(),
    body('foodPreference').optional().isString(),
  ],
  validate,
  aiController.mealSuggestions
);

// ── Diet Plan CRUD ──────────────────────────────────────────────────────
router.get('/diet-plan', aiController.getLatestPlan);
router.get('/diet-plans', aiController.listDietPlans);
router.get('/diet-plans/:planId', aiController.getDietPlanById);

// ── Chat with Aria ──────────────────────────────────────────────────────
router.post(
  '/chat',
  [
    body('message').isString().trim().notEmpty().withMessage('Message cannot be empty'),
    body('conversationId').optional().isString(),
    body('context').optional().isObject(),
  ],
  validate,
  aiController.sendChatMessage
);

router.get('/chat/history', aiController.getChatHistory);

export default router;
