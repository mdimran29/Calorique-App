// src/services/nutrition.service.ts — Spoonacular API integration
import axios from 'axios';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { indianFoodsService, type IndianFood } from './indianFoods.service';

const SPOONACULAR_BASE = 'https://api.spoonacular.com';
const API_KEY = () => process.env.SPOONACULAR_API_KEY;

function isKeyConfigured(): boolean {
  const key = API_KEY();
  return !!key && key !== 'dummy_spoonacular_key';
}

function toSearchResult(food: IndianFood) {
  const serving = indianFoodsService.getServing(food.id);
  return {
    id: food.id,
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    unit: food.unit,
    pieceLabel: serving.pieceLabel,
    pieceGrams: serving.pieceGrams,
    source: 'indian' as const,
  };
}

async function searchSpoonacularIngredients(query: string, number: number) {
  if (!isKeyConfigured()) return [];
  try {
    const res = await axios.get(`${SPOONACULAR_BASE}/food/ingredients/search`, {
      params: { query, number, apiKey: API_KEY(), metaInformation: true },
      timeout: 8000,
    });

    const results = res.data?.results ?? [];
    if (results.length === 0) return [];

    // Fetch nutrition for each ingredient in parallel (Spoonacular search doesn't return macros directly)
    const withNutrition = await Promise.allSettled(
      results.slice(0, number).map(async (item: any) => {
        const details = await axios.get(
          `${SPOONACULAR_BASE}/food/ingredients/${item.id}/information`,
          { params: { amount: 100, unit: 'grams', apiKey: API_KEY() }, timeout: 8000 }
        );
        const nutrients = details.data?.nutrition?.nutrients ?? [];
        const get = (n: string) => nutrients.find((x: any) => x.name === n)?.amount ?? 0;
        return {
          id: `sp_${item.id}`,
          name: details.data?.name ?? item.name,
          calories: Math.round(get('Calories')),
          protein: Math.round(get('Protein') * 10) / 10,
          carbs: Math.round(get('Carbohydrates') * 10) / 10,
          fat: Math.round(get('Fat') * 10) / 10,
          fiber: Math.round(get('Fiber') * 10) / 10,
          unit: '100g',
          source: 'spoonacular' as const,
        };
      })
    );

    return withNutrition
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value);
  } catch (err: any) {
    logger.error('Spoonacular search error', err?.response?.data ?? err?.message);
    return [];
  }
}

export const nutritionService = {
  /**
   * Merged food search: curated Indian foods database (fast, accurate, always available)
   * supplemented with Spoonacular global ingredient data. Indian matches are ranked first
   * since they're far more relevant and precise for the app's primary user base.
   */
  async searchFood(query: string, number = 10) {
    const indianMatches = indianFoodsService.search(query, number).map(toSearchResult);

    // Only hit Spoonacular for remaining slots — saves quota and latency
    const remaining = Math.max(number - indianMatches.length, 0);
    const spoonacularMatches = remaining > 0 ? await searchSpoonacularIngredients(query, remaining) : [];

    return [...indianMatches, ...spoonacularMatches];
  },

  async getFoodDetails(id: string | number, amount = 100, unit = 'grams') {
    const idStr = String(id);

    // Indian food IDs (e.g. "in_12") — served from the local curated dataset
    if (idStr.startsWith('in_')) {
      const food = indianFoodsService.getById(idStr);
      if (!food) throw ApiError.notFound('Food not found');
      const scale = amount / 100;
      return {
        id: food.id,
        name: food.name,
        calories: Math.round(food.calories * scale),
        protein: Math.round(food.protein * scale * 10) / 10,
        carbs: Math.round(food.carbs * scale * 10) / 10,
        fats: Math.round(food.fat * scale * 10) / 10,
        fiber: Math.round(food.fiber * scale * 10) / 10,
      };
    }

    // Spoonacular IDs (e.g. "sp_9266") — strip prefix, fall back to raw numeric id
    const spoonacularId = idStr.startsWith('sp_') ? idStr.slice(3) : idStr;

    if (!isKeyConfigured()) throw ApiError.serviceUnavailable('Nutrition search service unavailable');

    try {
      const res = await axios.get(`${SPOONACULAR_BASE}/food/ingredients/${spoonacularId}/information`, {
        params: { amount, unit, apiKey: API_KEY() },
        timeout: 10000,
      });
      const { name, nutrition } = res.data;
      const nutrients = nutrition?.nutrients ?? [];
      const get = (n: string) => nutrients.find((x: any) => x.name === n)?.amount ?? 0;
      return {
        id: idStr,
        name,
        calories: get('Calories'),
        protein:  get('Protein'),
        carbs:    get('Carbohydrates'),
        fats:     get('Fat'),
        fiber:    get('Fiber'),
      };
    } catch (err: any) {
      logger.error('Spoonacular details error', err?.response?.data);
      throw ApiError.serviceUnavailable('Nutrition service unavailable');
    }
  },

  async getProductByBarcode(barcode: string) {
    try {
      const res = await axios.get(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
        timeout: 10000,
      });
      if (res.data.status !== 1) throw ApiError.notFound('Product not found');
      const p = res.data.product;
      const n = p.nutriments ?? {};
      return {
        name:     p.product_name ?? 'Unknown',
        brand:    p.brands ?? '',
        barcode,
        calories: n['energy-kcal_100g'] ?? 0,
        protein:  n['proteins_100g'] ?? 0,
        carbs:    n['carbohydrates_100g'] ?? 0,
        fats:     n['fat_100g'] ?? 0,
        fiber:    n['fiber_100g'] ?? 0,
        imageUrl: p.image_url ?? '',
      };
    } catch (err: any) {
      if (err?.statusCode) throw err;
      logger.error('OpenFoodFacts error', err?.response?.data);
      throw ApiError.serviceUnavailable('Barcode service unavailable');
    }
  },
};
