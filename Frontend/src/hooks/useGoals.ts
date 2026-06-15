// hooks/useGoals.ts — TanStack Query hooks for goals API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalsApi } from '../api/goals.api';
import { today } from '../utils/dateUtils';
import { STALE_TIME_MS, GC_TIME_MS } from '../utils/constants';
import type { SetGoalPayload } from '../types/goal.types';

// ── Query Keys ────────────────────────────────────────────────────────

export const goalKeys = {
  all:           ['goals'] as const,
  current:       () => ['goals', 'current'] as const,
  progress:      (date: string)   => ['goals', 'progress', date] as const,
  progressRange: (start: string, end: string) => ['goals', 'progress', start, end] as const,
};

// ── Current Goals ─────────────────────────────────────────────────────

export function useGoals() {
  return useQuery({
    queryKey:  goalKeys.current(),
    queryFn:   () => goalsApi.getGoals(),
    staleTime: GC_TIME_MS,   // Goals don't change often
    gcTime:    GC_TIME_MS * 2,
  });
}

// ── Today's Goal Progress ─────────────────────────────────────────────

export function useTodayProgress() {
  const date = today();
  return useQuery({
    queryKey:  goalKeys.progress(date),
    queryFn:   () => goalsApi.getGoalProgress(date),
    staleTime: STALE_TIME_MS,
  });
}

// ── Progress for a specific date ──────────────────────────────────────

export function useGoalProgress(date: string) {
  return useQuery({
    queryKey:  goalKeys.progress(date),
    queryFn:   () => goalsApi.getGoalProgress(date),
    staleTime: STALE_TIME_MS,
  });
}

// ── Progress for a date range ─────────────────────────────────────────

export function useGoalProgressRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: goalKeys.progressRange(startDate, endDate),
    queryFn:  () => goalsApi.getGoalProgressRange(startDate, endDate),
    staleTime: STALE_TIME_MS,
    enabled:  !!startDate && !!endDate,
  });
}

// ── Set / Update Goals ────────────────────────────────────────────────

export function useSetGoals() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetGoalPayload) => goalsApi.setGoals(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.all });
    },
  });
}
