// src/controllers/meal.controller.ts
import { Request, Response } from 'express';
import { mealService } from '../services/meal.service';
import { sendSuccess } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import axios from 'axios';

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
    if (!query) {
      sendSuccess(res, { results: [] }, 'Search complete');
      return;
    }
    
    const apiKey = process.env.SPOONACULAR_API_KEY;
    try {
      if (!apiKey || apiKey === 'dummy_spoonacular_key') {
        throw new Error("Missing or invalid Spoonacular API key, falling back to mock data");
      }

      const response = await axios.get(`https://api.spoonacular.com/recipes/complexSearch`, {
        params: {
          query,
          addRecipeNutrition: true,
          number: 10,
          apiKey
        }
      });

      const results = response.data.results.map((item: any) => {
        const nutrients = item.nutrition?.nutrients || [];
        const getNutrient = (name: string) => nutrients.find((n: any) => n.name === name)?.amount || 0;
        
        return {
          id: item.id,
          name: item.title,
          calories: Math.round(getNutrient('Calories')),
          protein: Math.round(getNutrient('Protein')),
          carbs: Math.round(getNutrient('Carbohydrates')),
          fat: Math.round(getNutrient('Fat')),
          unit: 'serving',
          image: item.image
        };
      });

      sendSuccess(res, { results }, 'Search complete');
    } catch (error) {
      console.warn('Spoonacular error, using mock data:', error instanceof Error ? error.message : String(error));
      
      // Fallback mock data
      const mockResults = [
        { id: 1, name: `${query} (Mock 1)`, calories: 150, protein: 5, carbs: 20, fat: 3, unit: 'serving' },
        { id: 2, name: `${query} (Mock 2)`, calories: 300, protein: 12, carbs: 45, fat: 8, unit: 'serving' },
        { id: 3, name: `${query} (Mock 3)`, calories: 85, protein: 1, carbs: 22, fat: 0, unit: 'serving' },
      ];
      
      sendSuccess(res, { results: mockResults }, 'Search complete with mock data');
    }
  }),
};
