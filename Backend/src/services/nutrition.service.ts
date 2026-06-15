// src/services/nutrition.service.ts — Spoonacular API integration
import axios from 'axios';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

const SPOONACULAR_BASE = 'https://api.spoonacular.com';
const API_KEY = () => process.env.SPOONACULAR_API_KEY;

export const nutritionService = {
  async searchFood(query: string, number = 10) {
    try {
      const res = await axios.get(`${SPOONACULAR_BASE}/food/ingredients/search`, {
        params: { query, number, apiKey: API_KEY(), metaInformation: true },
        timeout: 10000,
      });
      return res.data.results;
    } catch (err: any) {
      logger.error('Spoonacular search error', err?.response?.data);
      throw ApiError.serviceUnavailable('Nutrition search service unavailable');
    }
  },

  async getFoodDetails(id: number, amount = 100, unit = 'grams') {
    try {
      const res = await axios.get(`${SPOONACULAR_BASE}/food/ingredients/${id}/information`, {
        params: { amount, unit, apiKey: API_KEY() },
        timeout: 10000,
      });
      const { name, nutrition } = res.data;
      const nutrients = nutrition?.nutrients ?? [];
      const get = (n: string) => nutrients.find((x: any) => x.name === n)?.amount ?? 0;
      return {
        id,
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
