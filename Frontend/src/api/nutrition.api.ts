// api/nutrition.api.ts — searchFood(), getBarcode() via Spoonacular/OpenFoodFacts

import apiClient from './client';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';
import type { FoodItem } from '../types/meal.types';

export interface FoodSearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  cuisine?: string;  // e.g., 'indian'
}

export interface BarcodeResult {
  foodItem: FoodItem;
  source: 'openfoodfacts' | 'spoonacular';
}

export const nutritionApi = {
  /**
   * Full-text search for food items (Spoonacular + custom DB)
   */
  searchFood: (params: FoodSearchParams) =>
    apiClient
      .get<PaginatedResponse<FoodItem>>('/nutrition/search', { params })
      .then((r) => r.data),

  /**
   * Lookup food by barcode (OpenFoodFacts)
   */
  getBarcode: (barcode: string) =>
    apiClient
      .get<ApiResponse<BarcodeResult>>(`/nutrition/barcode/${barcode}`)
      .then((r) => r.data),

  /**
   * Get detailed nutritional info for a specific food item
   */
  getFoodItem: (id: string) =>
    apiClient
      .get<ApiResponse<FoodItem>>(`/nutrition/foods/${id}`)
      .then((r) => r.data),

  /**
   * Get autocomplete suggestions as user types
   */
  autocomplete: (query: string) =>
    apiClient
      .get<ApiResponse<Pick<FoodItem, 'id' | 'name' | 'brand'>[]>>('/nutrition/autocomplete', {
        params: { query },
      })
      .then((r) => r.data),

  /**
   * Analyse a food photo (AI vision)
   */
  analyseImage: (imageBase64: string) =>
    apiClient
      .post<ApiResponse<FoodItem[]>>('/nutrition/analyse-image', { image: imageBase64 })
      .then((r) => r.data),
};
