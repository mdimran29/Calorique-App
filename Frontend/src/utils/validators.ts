// utils/validators.ts — Zod schemas for form validation

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name too long'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// ── Onboarding / Profile ──────────────────────────────────────────────

export const profileSetupSchema = z.object({
  age: z.coerce
    .number()
    .int()
    .min(13, 'Minimum age is 13')
    .max(120, 'Invalid age'),
  gender: z.enum(['male', 'female', 'other']),
  heightCm: z.coerce
    .number()
    .min(100, 'Minimum height is 100 cm')
    .max(250, 'Invalid height'),
  weightKg: z.coerce
    .number()
    .min(20, 'Minimum weight is 20 kg')
    .max(300, 'Invalid weight'),
  targetWeightKg: z.coerce
    .number()
    .min(20, 'Minimum target weight is 20 kg')
    .max(300, 'Invalid target weight'),
  activityLevel: z.enum([
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'super_active',
  ]),
});

// ── Goals ─────────────────────────────────────────────────────────────

export const setGoalSchema = z.object({
  dailyCalories: z.coerce
    .number()
    .int()
    .min(1000, 'Minimum 1000 kcal/day')
    .max(6000, 'Maximum 6000 kcal/day'),
  dailyProtein: z.coerce.number().min(0).max(500),
  dailyCarbs:   z.coerce.number().min(0).max(1000),
  dailyFat:     z.coerce.number().min(0).max(500),
  dailyWaterGlasses: z.coerce.number().int().min(1).max(30),
  targetWeightKg: z.coerce.number().min(20).max(300),
  fitnessGoal: z.enum(['muscle_gain', 'fat_loss', 'lean_bulk', 'maintenance']),
});

// ── Meal Logging ──────────────────────────────────────────────────────

export const addMealSchema = z.object({
  foodItemId: z.string().min(1, 'Select a food item'),
  portionGrams: z.coerce
    .number()
    .min(1, 'Minimum 1g portion')
    .max(2000, 'Maximum 2000g portion'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
});

// ── Weight Log ────────────────────────────────────────────────────────

export const logWeightSchema = z.object({
  weightKg: z.coerce
    .number()
    .min(20, 'Minimum 20 kg')
    .max(300, 'Maximum 300 kg'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  notes: z.string().max(200).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────

export type LoginFormValues          = z.infer<typeof loginSchema>;
export type RegisterFormValues       = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ProfileSetupFormValues   = z.infer<typeof profileSetupSchema>;
export type SetGoalFormValues        = z.infer<typeof setGoalSchema>;
export type AddMealFormValues        = z.infer<typeof addMealSchema>;
export type LogWeightFormValues      = z.infer<typeof logWeightSchema>;
