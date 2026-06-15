// src/routes/user.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();
router.use(authenticate);

router.get('/profile', userController.getProfile);

router.put(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('age').optional().isInt({ min: 13, max: 120 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('height').optional().isFloat({ min: 50, max: 300 }),
    body('weight').optional().isFloat({ min: 20, max: 500 }),
    body('activityLevel').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    body('goal').optional().isIn(['muscle_gain', 'fat_loss', 'maintain', 'lean_bulk']),
    body('foodPreference').optional().isIn(['veg', 'non_veg', 'vegan', 'eggetarian']),
    body('allergies').optional().isArray(),
    body('budget').optional().isIn(['low', 'medium', 'high']),
    body('targetWeight').optional().isFloat({ min: 20, max: 500 }),
  ],
  validate,
  userController.updateProfile
);

router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

export default router;
