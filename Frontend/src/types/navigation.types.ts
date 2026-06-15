// types/navigation.types.ts — Navigation param list types (web routing equivalent)

export type TabId = 'home' | 'meals' | 'ai' | 'goals' | 'analytics' | 'profile';

export type AuthScreen = 'login' | 'register' | 'forgot-password';

export type OnboardingScreen =
  | 'welcome'
  | 'goal-select'
  | 'profile-setup'
  | 'allergies';

export type MealScreen =
  | 'meal-list'
  | 'add-meal'
  | 'food-search'
  | 'barcode-scan'
  | 'meal-detail';

export type AIScreen =
  | 'diet-generator'
  | 'diet-result'
  | 'ai-coach';

export type GoalScreen =
  | 'goal-overview'
  | 'set-goal';

export type ProfileScreen =
  | 'profile'
  | 'edit-profile'
  | 'settings'
  | 'progress';

export interface NavigationState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  currentTab: TabId;
  currentScreen: string;
  modalStack: string[];
}

export type AppRoute =
  | { type: 'auth'; screen: AuthScreen }
  | { type: 'onboarding'; screen: OnboardingScreen }
  | { type: 'main'; tab: TabId; screen?: string };
