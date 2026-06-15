// types/user.types.ts — User and UserProfile interfaces

export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;           // matches backend field
  displayName?: string;   // alias kept for compat
  avatar?: string | null;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  isOnboarded?: boolean;
  profileComplete?: boolean;
  isPremium: boolean;
  streak?: number;
  // Profile fields stored directly on User in backend
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  targetWeight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal?: 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintain';
  foodPreference?: 'veg' | 'non_veg' | 'eggetarian' | 'vegan';
  allergies?: string[];
  budget?: 'low' | 'medium' | 'high';
}

export interface UserProfile {
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintain';
  dietType: 'veg' | 'non_veg' | 'eggetarian' | 'vegan';
  allergies: string[];
  mealReminders: boolean;
  waterReminders: boolean;
  darkMode: boolean;
  language: 'en' | 'hi';
  notificationsEnabled: boolean;
  timezone: string;
}

export interface UserStats {
  daysActive: number;
  mealsLogged: number;
  goalsHit: number;
  currentStreak: number;
  longestStreak: number;
  totalCaloriesLogged: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  language: string;
  notifications: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
}
