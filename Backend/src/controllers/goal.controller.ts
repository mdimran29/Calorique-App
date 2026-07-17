// src/controllers/goal.controller.ts
import { Request, Response } from 'express';
import { goalService } from '../services/goal.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const goalController = {
  getGoals: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const goals = await goalService.getGoals(userId);
    sendSuccess(res, { goals });
  }),

  setGoals: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const goals = await goalService.setGoals(userId, req.body);
    sendSuccess(res, { goals }, 'Goals updated successfully');
  }),

  autoCalculate: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const goals = await goalService.autoCalculateGoals(userId);
    sendSuccess(res, { goals }, 'Goals auto-calculated from your profile');
  }),

  getGoalProgress: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const progress = await goalService.getGoalProgress(userId, req.params.date);
    sendSuccess(res, progress as any);
  }),

  getGoalProgressRange: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { startDate, endDate } = req.query as Record<string, string>;
    const progress = await goalService.getGoalProgressRange(userId, startDate, endDate);
    sendSuccess(res, progress as any);
  }),
};
