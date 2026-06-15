// src/controllers/progress.controller.ts
import { Request, Response } from 'express';
import { progressService } from '../services/progress.service';
import { nutritionService } from '../services/nutrition.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const progressController = {
  getProgress: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const progress = await progressService.getProgress(userId);
    sendSuccess(res, { progress });
  }),

  logWeight: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { weight } = req.body;
    const progress = await progressService.logWeight(userId, weight);
    sendSuccess(res, { progress }, 'Weight logged successfully', 201);
  }),

  logWater: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { liters } = req.body;
    const progress = await progressService.logWater(userId, liters);
    sendSuccess(res, { progress }, 'Water intake logged', 201);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const days = req.query.days ? Number(req.query.days) : 30;
    const analytics = await progressService.getAnalytics(userId, days);
    sendSuccess(res, { analytics });
  }),

  // Nutrition search endpoints
  searchFood: asyncHandler(async (req: Request, res: Response) => {
    const { q, number } = req.query as { q: string; number?: string };
    const results = await nutritionService.searchFood(q, number ? Number(number) : 10);
    sendSuccess(res, { results });
  }),

  getFoodDetails: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, unit } = req.query as Record<string, string>;
    const food = await nutritionService.getFoodDetails(Number(id), amount ? Number(amount) : 100, unit ?? 'grams');
    sendSuccess(res, { food });
  }),

  getBarcode: asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;
    const product = await nutritionService.getProductByBarcode(barcode);
    sendSuccess(res, { product });
  }),
};
