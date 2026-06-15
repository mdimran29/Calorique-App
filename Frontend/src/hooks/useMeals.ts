// hooks/useMeals.ts — TanStack Query hooks for meals API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealsApi, type GetMealsParams } from '../api/meals.api';
import { useMealStore } from '../store/mealStore';
import { today } from '../utils/dateUtils';
import { STALE_TIME_MS, GC_TIME_MS } from '../utils/constants';
import type { CreateMealPayload, UpdateMealPayload } from '../types/meal.types';

// ── Query Keys ──────────────────────────────────────────────────────────

export const mealKeys = {
  all:     ['meals'] as const,
  date:    (date: string)   => ['meals', 'date', date] as const,
  summary: (date: string)   => ['meals', 'summary', date] as const,
  history: (params: object) => ['meals', 'history', params] as const,
  detail:  (id: string)     => ['meals', 'detail', id] as const,
};

// ── Today's Meals ───────────────────────────────────────────────────────

export function useTodayMeals() {
  const date = today();
  return useQuery({
    queryKey:  mealKeys.date(date),
    queryFn:   () => mealsApi.getMeals({ date }),
    staleTime: STALE_TIME_MS,
    gcTime:    GC_TIME_MS,
  });
}

// ── Daily Summary ───────────────────────────────────────────────────────

export function useDailySummary(date: string = today()) {
  return useQuery({
    queryKey:  mealKeys.summary(date),
    queryFn:   () => mealsApi.getDailySummary(date),
    staleTime: STALE_TIME_MS,
    gcTime:    GC_TIME_MS,
  });
}

// ── Specific Day Meals ──────────────────────────────────────────────────

export function useMealsForDate(date: string) {
  return useQuery({
    queryKey: mealKeys.date(date),
    queryFn:  () => mealsApi.getMeals({ date }),
    staleTime: STALE_TIME_MS,
  });
}

// ── Create Meal ─────────────────────────────────────────────────────────

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMealPayload) => mealsApi.createMeal(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mealKeys.date(variables.date) });
      queryClient.invalidateQueries({ queryKey: mealKeys.summary(variables.date) });
      queryClient.invalidateQueries({ queryKey: mealKeys.all });
    },
  });
}

// ── Update Meal ─────────────────────────────────────────────────────────

export function useUpdateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMealPayload) => mealsApi.updateMeal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.all });
    },
  });
}

// ── Delete Meal ─────────────────────────────────────────────────────────

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mealsApi.deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealKeys.all });
    },
  });
}

// ── Log Water ────────────────────────────────────────────────────────────

export function useLogWater() {
  const queryClient = useQueryClient();
  const setWater    = useMealStore((s) => s.setWater);
  return useMutation({
    mutationFn: ({ date, glasses }: { date: string; glasses: number }) =>
      mealsApi.logWater(date, glasses),
    onMutate: ({ date, glasses }) => {
      // Optimistic update
      setWater(date, glasses);
    },
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: mealKeys.summary(date) });
    },
  });
}
