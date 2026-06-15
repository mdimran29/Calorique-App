// api/ai.api.ts — generateDiet(), getMealSuggestions(), sendChatMessage()

import apiClient from './client';
import type { ApiResponse } from '../types/api.types';
import type {
  DietPlan,
  MealSuggestion,
  GenerateDietPayload,
  ChatMessage,
  ChatResponse,
  SendMessagePayload,
} from '../types/ai.types';

export const aiApi = {
  /**
   * Generate a personalised 7-day diet plan via Gemini AI
   */
  generateDiet: (payload: GenerateDietPayload) =>
    apiClient
      .post<ApiResponse<DietPlan>>('/ai/generate-diet', payload, {
        timeout: 120_000, // 2 min — Gemini 7-day plan generation is slow
      })
      .then((r) => r.data),

  /**
   * Get AI-generated meal suggestions for today
   */
  getMealSuggestions: (mealType?: string) =>
    apiClient
      .get<ApiResponse<MealSuggestion[]>>('/ai/meal-suggestions', {
        params: mealType ? { mealType } : undefined,
      })
      .then((r) => r.data),

  /**
   * Send a chat message to Aria (AI Dietitian coach)
   */
  sendChatMessage: (payload: SendMessagePayload) =>
    apiClient
      .post<ApiResponse<ChatResponse>>('/ai/chat', payload, {
        timeout: 60_000, // 60s for chat responses
      })
      .then((r) => r.data),

  /**
   * Get chat history for a conversation
   */
  getChatHistory: (conversationId?: string) =>
    apiClient
      .get<ApiResponse<ChatMessage[]>>('/ai/chat/history', {
        params: conversationId ? { conversationId } : undefined,
      })
      .then((r) => r.data),

  /**
   * Get a previously saved diet plan
   */
  getSavedDietPlan: (planId: string) =>
    apiClient
      .get<ApiResponse<DietPlan>>(`/ai/diet-plans/${planId}`)
      .then((r) => r.data),

  /**
   * List all saved diet plans
   */
  listDietPlans: () =>
    apiClient
      .get<ApiResponse<DietPlan[]>>('/ai/diet-plans')
      .then((r) => r.data),
};
