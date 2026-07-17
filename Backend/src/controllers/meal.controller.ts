// src/controllers/meal.controller.ts
import { Request, Response } from 'express';
import { mealService } from '../services/meal.service';
import { nutritionService } from '../services/nutrition.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const mealController = {
  getMeals: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { date, page, limit, startDate, endDate } = req.query as Record<string, string>;

    const result = await mealService.getMeals(userId, {
      date,
      page:      page ? Number(page) : undefined,
      limit:     limit ? Number(limit) : undefined,
      startDate,
      endDate,
    });

    const total = result.total;
    const pages = Math.ceil(total / (Number(limit) || 10));

    sendSuccess(
      res,
      { meals: result.meals },
      'Meals retrieved',
      200,
      { page: Number(page) || 1, limit: Number(limit) || 10, total, pages, hasNext: (Number(page) || 1) < pages, hasPrev: (Number(page) || 1) > 1 }
    );
  }),

  createMeal: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const meal = await mealService.logMeal(userId, req.body);
    sendSuccess(res, { meal }, 'Meal logged successfully', 201);
  }),

  updateMeal: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const meal = await mealService.updateMeal(userId, req.params.id, req.body);
    sendSuccess(res, { meal }, 'Meal updated successfully');
  }),

  deleteMeal: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    await mealService.deleteMeal(userId, req.params.id);
    sendSuccess(res, null, 'Meal deleted successfully');
  }),

  searchFood: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query || !query.trim()) {
      sendSuccess(res, { results: [] }, 'Search complete');
      return;
    }

    const results = await nutritionService.searchFood(query, 15);
    sendSuccess(res, { results }, 'Search complete');
  }),

  getMealById: asyncHandler(async (req: Request, res: Response) => {
    const meal = await mealService.getMealById(req.params.id);
    sendSuccess(res, { meal }, 'Meal retrieved');
  }),

  getDailySummary: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const summary = await mealService.getDailySummary(userId, req.params.date);
    sendSuccess(res, { summary }, 'Daily summary retrieved');
  }),

  logWater: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { date, glasses } = req.body as { date: string; glasses: number };
    const result = await mealService.logWater(userId, date, glasses);
    sendSuccess(res, result, 'Water intake logged', 201);
  }),

  getMealHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const { startDate, endDate, page, pageSize } = req.query as Record<string, string>;
    const result = await mealService.getMealHistory(userId, {
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    sendSuccess(
      res,
      { items: result.items },
      'Meal history retrieved',
      200,
      { page: result.page, limit: pageSize ? Number(pageSize) : 14, total: result.total, pages: result.pages, hasNext: result.page < result.pages, hasPrev: result.page > 1 }
    );
  }),
};
