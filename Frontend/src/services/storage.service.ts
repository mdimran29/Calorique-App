// services/storage.service.ts — Local storage with typed helpers

import { STORAGE_KEYS } from '../utils/constants';
import type { User } from '../types/user.types';

/** Generic typed get/set/remove for localStorage */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};

// ── Typed helpers ─────────────────────────────────────────────────────

export const storageService = {
  getAccessToken:  () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken:  (t: string) => localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, t),

  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (t: string) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, t),

  clearTokens: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  getUser:  () => storage.get<User>(STORAGE_KEYS.USER),
  setUser:  (u: User) => storage.set(STORAGE_KEYS.USER, u),
  clearUser:() => storage.remove(STORAGE_KEYS.USER),

  clearAll: () => {
    storageService.clearTokens();
    storageService.clearUser();
  },
};
