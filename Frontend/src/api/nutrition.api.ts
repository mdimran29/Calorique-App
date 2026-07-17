// api/nutrition.api.ts — searchFood(), getBarcode() via Spoonacular/OpenFoodFacts

import apiClient from './client';
import type { ApiResponse } from '../types/api.types';

export interface FoodSearchParams {
  query: string;
  number?: number;
}

export interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  unit: string;
  /** e.g. "piece", "plate", "bowl" — null when the food is only measured by weight */
  pieceLabel?: string | null;
  /** Grams per one piece/plate/bowl, when pieceLabel is set */
  pieceGrams?: number | null;
  source: 'indian' | 'spoonacular';
}

export interface BarcodeProduct {
  name: string;
  brand: string;
  barcode: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  imageUrl: string;
}

export const nutritionApi = {
  /**
   * Full-text search for food items (curated Indian DB + Spoonacular)
   */
  searchFood: (params: FoodSearchParams) =>
    apiClient
      .get<ApiResponse<{ results: FoodSearchResult[] }>>('/progress/nutrition/search', {
        params: { q: params.query, number: params.number },
      })
      .then((r) => ({ ...r.data, data: r.data.data.results })),

  /**
   * Lookup food by barcode (OpenFoodFacts)
   */
  getBarcode: (barcode: string) =>
    apiClient
      .get<ApiResponse<{ product: BarcodeProduct }>>(`/progress/nutrition/barcode/${barcode}`)
      .then((r) => ({ ...r.data, data: r.data.data.product })),

  /**
   * Get detailed nutritional info for a specific food item (by id, Indian or Spoonacular)
   */
  getFoodItem: (id: string, amount = 100, unit = 'grams') =>
    apiClient
      .get<ApiResponse<{ food: FoodSearchResult }>>(`/progress/nutrition/${id}`, { params: { amount, unit } })
      .then((r) => ({ ...r.data, data: r.data.data.food })),
};
