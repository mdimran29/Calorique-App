// src/config/gemini.ts — Google Gemini AI client setup
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');
    geminiClient = new GoogleGenerativeAI(apiKey);
    logger.info('✅ Gemini AI client initialized');
  }
  return geminiClient;
}

export function getGeminiModel(modelName = 'gemini-2.5-flash') {
  return getGeminiClient().getGenerativeModel({ model: modelName });
}
