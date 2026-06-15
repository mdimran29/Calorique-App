// hooks/useAuth.ts — Authentication state & actions

import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { authApi, type LoginPayload, type RegisterPayload } from '../api/auth.api';
import { STORAGE_KEYS } from '../utils/constants';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isOnboarded,
    setUser,
    setTokens,
    setOnboarded,
    updateUser,
    logout: storeLogout,
  } = useAuthStore();

  // ── Login ───────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: ({ data }) => {
      setUser(data.user);
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    },
  });

  // ── Register ────────────────────────────────────────────────────────
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: ({ data }) => {
      setUser(data.user);
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    },
  });

  // ── Forgot Password ─────────────────────────────────────────────────
  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });

  // ── Logout ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      try { await authApi.logout(refreshToken); } catch { /* ignore */ }
    }
    storeLogout();
  }, [storeLogout]);

  return {
    // State
    user,
    isAuthenticated,
    isOnboarded,

    // Mutations
    login:          loginMutation.mutate,
    loginAsync:     loginMutation.mutateAsync,
    register:       registerMutation.mutate,
    registerAsync:  registerMutation.mutateAsync,
    forgotPassword: forgotPasswordMutation.mutate,
    logout,

    // Status
    isLoggingIn:    loginMutation.isPending,
    isRegistering:  registerMutation.isPending,
    loginError:     loginMutation.error,
    registerError:  registerMutation.error,

    // Profile
    updateUser,
    setOnboarded,
  };
}
