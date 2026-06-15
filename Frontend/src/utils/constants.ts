// utils/constants.ts — App-wide constants

export const APP_NAME = 'Nutrivora AI';
export const APP_VERSION = '1.0.0';

// API
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
export const API_TIMEOUT_MS = 30_000;

// Cache
export const STALE_TIME_MS = 5 * 60 * 1000;    // 5 minutes
export const GC_TIME_MS    = 30 * 60 * 1000;   // 30 minutes

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Meal types
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const MEAL_ICONS: Record<string, string> = {
  breakfast: '☀️',
  lunch:     '🍛',
  dinner:    '🌙',
  snack:     '🥜',
};
export const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snacks',
};

// Nutrition
export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs:   4,
  fat:     9,
  fiber:   2,
} as const;

// Water tracking
export const WATER_GLASS_ML    = 250;       // ml per glass
export const DEFAULT_WATER_GOAL = 10;       // glasses per day

// Goals
export const ACTIVITY_LEVELS = [
  { value: 'sedentary',          label: 'Sedentary (desk job)', multiplier: 1.2 },
  { value: 'lightly_active',     label: 'Lightly Active (1-3x/week)', multiplier: 1.375 },
  { value: 'moderately_active',  label: 'Moderately Active (3-5x/week)', multiplier: 1.55 },
  { value: 'very_active',        label: 'Very Active (6-7x/week)', multiplier: 1.725 },
  { value: 'super_active',       label: 'Super Active (2x/day)', multiplier: 1.9 },
] as const;

export const FITNESS_GOALS = [
  { value: 'muscle_gain',  label: 'Muscle Gain',  icon: '💪' },
  { value: 'fat_loss',     label: 'Fat Loss',     icon: '🔥' },
  { value: 'lean_bulk',    label: 'Lean Bulk',    icon: '⚡' },
  { value: 'maintenance',  label: 'Maintenance',  icon: '⚖️' },
] as const;

export const DIET_TYPES = [
  { value: 'veg',          label: 'Vegetarian', icon: '🥦' },
  { value: 'non_veg',      label: 'Non-Veg',    icon: '🍗' },
  { value: 'eggetarian',   label: 'Eggetarian', icon: '🥚' },
  { value: 'vegan',        label: 'Vegan',      icon: '🌱' },
] as const;

export const COMMON_ALLERGENS = [
  'Lactose', 'Gluten', 'Nuts', 'Soy', 'Shellfish', 'Eggs',
];

// Premium pricing
export const PREMIUM_PRICE_MONTHLY = 199;   // ₹
export const PREMIUM_PRICE_YEARLY  = 1499;  // ₹

// Streak
export const MIN_STREAK_CALORIES_PCT = 80;  // % of goal to count streak

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER:          'user',
  ONBOARDING:    'onboarding',
  THEME:         'theme',
  OFFLINE_QUEUE: 'offlineQueue',
} as const;
