// hooks/useNutrition.ts — Food search hooks (Spoonacular / custom DB)

import { useQuery } from '@tanstack/react-query';
import { nutritionApi, type FoodSearchParams } from '../api/nutrition.api';
import { useDebounce } from './useDebounce';
import { STALE_TIME_MS } from '../utils/constants';

// ── Query Keys ────────────────────────────────────────────────────────

export const nutritionKeys = {
  all:         ['nutrition'] as const,
  search:      (params: FoodSearchParams) => ['nutrition', 'search', params] as const,
  barcode:     (code: string) => ['nutrition', 'barcode', code] as const,
  food:        (id: string)   => ['nutrition', 'food', id] as const,
};

// ── Food Search ───────────────────────────────────────────────────────

export function useFoodSearch(query: string, params?: Omit<FoodSearchParams, 'query'>) {
  const debouncedQuery = useDebounce(query, 350);

  return useQuery({
    queryKey: nutritionKeys.search({ query: debouncedQuery, ...params }),
    queryFn:  () => nutritionApi.searchFood({ query: debouncedQuery, ...params }),
    enabled:  debouncedQuery.trim().length > 1,
    staleTime: STALE_TIME_MS,
  });
}

// ── Barcode Lookup ────────────────────────────────────────────────────

export function useBarcodeFood(barcode: string | null) {
  return useQuery({
    queryKey: nutritionKeys.barcode(barcode ?? ''),
    queryFn:  () => nutritionApi.getBarcode(barcode!),
    enabled:  !!barcode,
    staleTime: 60 * 60 * 1000,  // 1 hour — barcode data rarely changes
  });
}

// ── Single Food Item ──────────────────────────────────────────────────

export function useFoodItem(id: string) {
  return useQuery({
    queryKey: nutritionKeys.food(id),
    queryFn:  () => nutritionApi.getFoodItem(id),
    enabled:  !!id,
    staleTime: 60 * 60 * 1000,
  });
}
