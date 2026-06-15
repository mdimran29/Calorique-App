// store/onboardingStore.ts — Onboarding completion state and collected data

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type OnboardingStep = 'welcome' | 'goal-select' | 'profile-setup' | 'allergies' | 'complete';

interface OnboardingData {
  fitnessGoal?:    string;
  dietType?:       string;
  age?:            number;
  gender?:         'male' | 'female' | 'other';
  heightCm?:       number;
  weightKg?:       number;
  targetWeightKg?: number;
  activityLevel?:  string;
  allergies?:      string[];
}

interface OnboardingState {
  // State
  isComplete:    boolean;
  currentStep:   OnboardingStep;
  data:          OnboardingData;

  // Actions
  setStep:       (step: OnboardingStep) => void;
  updateData:    (partial: Partial<OnboardingData>) => void;
  complete:      () => void;
  reset:         () => void;
  nextStep:      () => void;
}

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'goal-select',
  'profile-setup',
  'allergies',
  'complete',
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isComplete:  false,
      currentStep: 'welcome',
      data:        {},

      setStep: (step) => set({ currentStep: step }),

      updateData: (partial) =>
        set((state) => ({ data: { ...state.data, ...partial } })),

      complete: () =>
        set({ isComplete: true, currentStep: 'complete' }),

      reset: () =>
        set({ isComplete: false, currentStep: 'welcome', data: {} }),

      nextStep: () => {
        const current = get().currentStep;
        const idx     = STEP_ORDER.indexOf(current);
        const next    = STEP_ORDER[idx + 1];
        if (next) {
          if (next === 'complete') {
            set({ isComplete: true, currentStep: 'complete' });
          } else {
            set({ currentStep: next });
          }
        }
      },
    }),
    {
      name:    'calorique-onboarding',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
