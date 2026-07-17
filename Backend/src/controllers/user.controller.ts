// src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const userController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await userService.getProfile(userId);
    sendSuccess(res, { user });
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const user = await userService.updateProfile(userId, req.body);
    sendSuccess(res, { user }, 'Profile updated successfully');
  }),

  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    await userService.deleteAccount(userId);
    sendSuccess(res, null, 'Account deleted successfully');
  }),

  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const settings = await userService.updateSettings(userId, req.body);
    sendSuccess(res, { settings }, 'Settings updated successfully');
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } });
      return;
    }
    const url = await userService.uploadAvatar(userId, file.buffer, file.mimetype);
    sendSuccess(res, { avatarUrl: url }, 'Avatar uploaded successfully');
  }),
};
