// store/settingsStore.ts — Theme, language, notification preferences

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme    = 'dark' | 'light' | 'system';
type Language = 'en' | 'hi';

interface SettingsState {
  // State
  theme:            Theme;
  language:         Language;
  notifications:    boolean;
  mealReminders:    boolean;
  waterReminders:   boolean;
  /** In units: metric (kg/cm) or imperial (lbs/in) */
  units:            'metric' | 'imperial';

  // Actions
  setTheme:          (theme: Theme) => void;
  setLanguage:       (lang: Language) => void;
  toggleNotifications: () => void;
  toggleMealReminders: () => void;
  toggleWaterReminders: () => void;
  setUnits:          (units: 'metric' | 'imperial') => void;
  resetSettings:     () => void;
}

const defaultSettings: Omit<SettingsState, keyof { [K in keyof SettingsState as SettingsState[K] extends (...args: unknown[]) => unknown ? K : never]: unknown }> = {
  theme:          'dark',
  language:       'en',
  notifications:  true,
  mealReminders:  true,
  waterReminders: true,
  units:          'metric',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme:    (theme)   => set({ theme }),
      setLanguage: (language) => set({ language }),

      toggleNotifications:  () => set((s) => ({ notifications:  !s.notifications })),
      toggleMealReminders:  () => set((s) => ({ mealReminders:  !s.mealReminders })),
      toggleWaterReminders: () => set((s) => ({ waterReminders: !s.waterReminders })),

      setUnits: (units) => set({ units }),

      resetSettings: () => set({ ...defaultSettings }),
    }),
    {
      name:    'calorique-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
