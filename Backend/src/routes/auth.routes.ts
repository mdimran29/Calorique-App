// src/routes/auth.routes.ts
import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { userRepository } from '../repositories/user.repository';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/ApiResponse';

const router = Router();

// ── Register ────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    // Email is required for password signup; Google/Phone signup identifies via firebaseToken instead
    body('email')
      .if(body('firebaseToken').not().exists())
      .isEmail().normalizeEmail().withMessage('Valid email required'),
    body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('displayName').optional().trim(),
    body('password').optional().isLength({ min: 6 }),
    body('firebaseToken').optional().isString(),
    body('age').optional().isInt({ min: 13, max: 120 }),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('height').optional().isFloat({ min: 50, max: 300 }),
    body('weight').optional().isFloat({ min: 20, max: 500 }),
    body('activityLevel').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    body('goal').optional(),
    body('foodPreference').optional(),
    body('allergies').optional().isArray(),
  ],
  validate,
  authController.register
);

// ── Login ────────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isString(),
    body('firebaseToken').optional().isString(),
  ],
  validate,
  authController.login
);

// ── Refresh token ────────────────────────────────────────────────────────
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  authController.refresh
);

// ── Logout ───────────────────────────────────────────────────────────────
router.post('/logout', authController.logout);

// ── DEV ONLY: instant dev-login (no Firebase needed) ─────────────────────
if (process.env.NODE_ENV !== 'production') {
  router.post(
    '/dev-login',
    asyncHandler(async (_req, res) => {
      const devEmail = 'dev@calorique.app';
      let user = await userRepository.findByEmail(devEmail);
      if (!user) {
        user = await userRepository.create({
          firebaseUid:     'dev-uid-local-001',
          name:            'Rahul Sharma',
          email:           devEmail,
          age:             25,
          gender:          'male' as any,
          height:          178,
          weight:          72,
          activityLevel:   'moderate' as any,
          goal:            'muscle_gain' as any,
          foodPreference:  'veg' as any,
          allergies:       [],
          profileComplete: true,
        });
      }
      const tokens = await authService.generateTokenPair(user);
      sendSuccess(res, {
        user,
        tokens: { ...tokens, expiresIn: 900 },
        accessToken:  tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }, 'Dev login successful');
    })
  );
}

export default router;
