// hooks/useProgress.ts — Progress/analytics hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi, type LogWeightPayload } from '../api/progress.api';
import { STALE_TIME_MS, GC_TIME_MS } from '../utils/constants';
import { getLastNDays } from '../utils/dateUtils';

// ── Query Keys ────────────────────────────────────────────────────────

export const progressKeys = {
  all:       ['progress'] as const,
  summary:   (params?: object) => ['progress', 'summary', params] as const,
  weight:    (params?: object) => ['progress', 'weight', params] as const,
  calories:  (days: number)   => ['progress', 'calories', days] as const,
};

// ── Full Progress Summary ─────────────────────────────────────────────

export function useProgress(days = 30) {
  const dates    = getLastNDays(days);
  const startDate = dates[0];
  const endDate   = dates[dates.length - 1];

  return useQuery({
    queryKey:  progressKeys.summary({ startDate, endDate }),
    queryFn:   () => progressApi.getProgress({ startDate, endDate }),
    staleTime: STALE_TIME_MS,
    gcTime:    GC_TIME_MS,
  });
}

// ── Weight History ────────────────────────────────────────────────────

export function useWeightHistory(days = 90) {
  return useQuery({
    queryKey:  progressKeys.weight({ days }),
    queryFn:   () => progressApi.getWeightHistory({ page: 1, pageSize: days }),
    staleTime: STALE_TIME_MS,
  });
}

// ── Calorie History for Charts ────────────────────────────────────────

export function useCalorieHistory(days = 7) {
  return useQuery({
    queryKey:  progressKeys.calories(days),
    queryFn:   () => progressApi.getCalorieHistory(days),
    staleTime: STALE_TIME_MS,
  });
}

// ── Log Weight ────────────────────────────────────────────────────────

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LogWeightPayload) => progressApi.logWeight(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

// ── Delete Weight Entry ───────────────────────────────────────────────

export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressApi.deleteWeightEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}
