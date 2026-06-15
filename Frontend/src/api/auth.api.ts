// api/auth.api.ts — login(), register(), refreshToken(), logout()

import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type { User } from '../types/user.types';

export interface LoginPayload {
  email?: string;
  password?: string;
  firebaseToken?: string;
}

export interface RegisterPayload {
  displayName: string;
  email: string;
  password?: string;
  firebaseToken?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  /**
   * Login with email + password
   */
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data),

  /**
   * Register a new user account
   */
  register: (payload: RegisterPayload) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload).then((r) => r.data),

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken: string) =>
    apiClient
      .post<ApiResponse<{ accessToken: string; expiresIn: number }>>('/auth/refresh', {
        refreshToken,
      })
      .then((r) => r.data),

  /**
   * Sign in with Google (returns redirect URL or token)
   */
  googleSignIn: () =>
    apiClient.get<ApiResponse<{ redirectUrl: string }>>('/auth/google').then((r) => r.data),

  /**
   * Request password reset email
   */
  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }).then((r) => r.data),

  /**
   * Reset password with token
   */
  resetPassword: (token: string, newPassword: string) =>
    apiClient
      .post<ApiResponse<null>>('/auth/reset-password', { token, newPassword })
      .then((r) => r.data),

  /**
   * Logout (invalidate refresh token on server)
   */
  logout: (refreshToken: string) =>
    apiClient.post<ApiResponse<null>>('/auth/logout', { refreshToken }).then((r) => r.data),
};
