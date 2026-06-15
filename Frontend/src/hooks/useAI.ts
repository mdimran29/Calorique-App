// hooks/useAI.ts — TanStack Query mutations for AI endpoints

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../api/ai.api';
import type { GenerateDietPayload, SendMessagePayload } from '../types/ai.types';
import { GC_TIME_MS } from '../utils/constants';

// ── Query Keys ────────────────────────────────────────────────────────

export const aiKeys = {
  all:         ['ai'] as const,
  dietPlans:   () => ['ai', 'diet-plans'] as const,
  dietPlan:    (id: string) => ['ai', 'diet-plans', id] as const,
  suggestions: (mealType?: string) => ['ai', 'suggestions', mealType] as const,
  chatHistory: (conversationId?: string) => ['ai', 'chat', conversationId] as const,
};

// ── Generate Diet Plan ────────────────────────────────────────────────

export function useGenerateDiet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateDietPayload) => aiApi.generateDiet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.dietPlans() });
    },
  });
}

// ── Get Meal Suggestions ──────────────────────────────────────────────

export function useMealSuggestions(mealType?: string) {
  return useQuery({
    queryKey: aiKeys.suggestions(mealType),
    queryFn:  () => aiApi.getMealSuggestions(mealType),
    staleTime: 10 * 60 * 1000,   // 10 minutes
    gcTime:   GC_TIME_MS,
  });
}

// ── Chat with Aria ────────────────────────────────────────────────────

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => aiApi.sendChatMessage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: aiKeys.chatHistory(variables.conversationId),
      });
    },
  });
}

// ── Chat History ──────────────────────────────────────────────────────

export function useChatHistory(conversationId?: string) {
  return useQuery({
    queryKey: aiKeys.chatHistory(conversationId),
    queryFn:  () => aiApi.getChatHistory(conversationId),
    staleTime: 2 * 60 * 1000,
  });
}

// ── Saved Diet Plans ──────────────────────────────────────────────────

export function useDietPlans() {
  return useQuery({
    queryKey: aiKeys.dietPlans(),
    queryFn:  () => aiApi.listDietPlans(),
    staleTime: GC_TIME_MS,
  });
}

export function useDietPlan(planId: string) {
  return useQuery({
    queryKey: aiKeys.dietPlan(planId),
    queryFn:  () => aiApi.getSavedDietPlan(planId),
    enabled:  !!planId,
    staleTime: GC_TIME_MS,
  });
}
