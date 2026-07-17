// src/controllers/progress.controller.ts
import { Request, Response } from 'express';
import { progressService } from '../services/progress.service';
import { nutritionService } from '../services/nutrition.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const progressController = {
  getProgress: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { startDate, endDate } = req.query as Record<string, string>;
    const progress = await progressService.getProgress(userId, startDate, endDate);
    sendSuccess(res, progress as any);
  }),

  logWeight: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { weightKg, date, notes } = req.body;
    const entry = await progressService.logWeight(userId, weightKg, date, notes);
    sendSuccess(res, entry as any, 'Weight logged successfully', 201);
  }),

  getWeightHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { page, pageSize } = req.query as Record<string, string>;
    const result = await progressService.getWeightHistory(
      userId,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 90
    );
    const pages = Math.ceil(result.total / result.pageSize) || 1;
    sendSuccess(
      res,
      result.items as any,
      'Weight history retrieved',
      200,
      { page: result.page, limit: result.pageSize, total: result.total, pages, hasNext: result.page < pages, hasPrev: result.page > 1 }
    );
  }),

  deleteWeightEntry: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    await progressService.deleteWeightEntry(userId, req.params.id);
    sendSuccess(res, null, 'Weight entry deleted');
  }),

  getCalorieHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const days = req.query.days ? Number(req.query.days) : 30;
    const history = await progressService.getCalorieHistory(userId, days);
    sendSuccess(res, history as any);
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
    const food = await nutritionService.getFoodDetails(id, amount ? Number(amount) : 100, unit ?? 'grams');
    sendSuccess(res, { food });
  }),

  getBarcode: asyncHandler(async (req: Request, res: Response) => {
    const { barcode } = req.params;
    const product = await nutritionService.getProductByBarcode(barcode);
    sendSuccess(res, { product });
  }),
};
