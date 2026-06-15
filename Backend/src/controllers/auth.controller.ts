// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);
    const { user, accessToken, refreshToken, expiresIn } = result as any;
    sendSuccess(res, {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken, expiresIn: expiresIn ?? 900 },
      // Also return flat accessToken for backwards compat
      accessToken,
      refreshToken,
    }, 'User registered successfully', 201);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { firebaseToken, email, password } = req.body;
    const result = await authService.login({ firebaseToken, email, password });
    const { user, accessToken, refreshToken, expiresIn } = result as any;
    sendSuccess(res, {
      user: sanitizeUser(user),
      tokens: { accessToken, refreshToken, expiresIn: expiresIn ?? 900 },
      accessToken,
      refreshToken,
    }, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) await authService.logout(refreshToken);
    sendSuccess(res, null, 'Logged out successfully');
  }),
};

function sanitizeUser(user: any) {
  if (!user) return user;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.__v;
  return obj;
}
