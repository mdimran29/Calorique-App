// store/authStore.ts — User session, tokens, login state
// Uses Zustand with localStorage persistence

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types/user.types';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setOnboarded: (value: boolean) => void;
  updateUser: (partial: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user:            null,
      isAuthenticated: false,
      isOnboarded:     false,
      accessToken:     null,
      refreshToken:    null,

      // Actions
      setUser: (user) =>
        set({ user, isAuthenticated: true, isOnboarded: user.isOnboarded }),

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        set({ accessToken, refreshToken });
      },

      setOnboarded: (value) =>
        set((state) => ({
          isOnboarded: value,
          user: state.user ? { ...state.user, isOnboarded: value } : null,
        })),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        set({
          user:            null,
          isAuthenticated: false,
          isOnboarded:     false,
          accessToken:     null,
          refreshToken:    null,
        });
      },
    }),
    {
      name:    'calorique-auth',
      storage: createJSONStorage(() => localStorage),
      // Don't persist raw tokens in Zustand — they're already in localStorage via setTokens
      partialize: (state) => ({
        user:            state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded:     state.isOnboarded,
      }),
    }
  )
);
