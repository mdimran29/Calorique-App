// src/services/indianFoods.service.ts — Curated Indian food database search
import indianFoodsData from '../data/indianFoods.json';

export interface IndianFood {
  id: string;
  name: string;
  aliases: string[];
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  category: string;
}

export interface ServingInfo {
  /** e.g. "piece", "plate", "bowl", "glass" — null when the food is only sold/measured by weight */
  pieceLabel: string | null;
  /** Grams per one piece/plate/bowl/etc., when pieceLabel is set */
  pieceGrams: number | null;
}

/**
 * Parses dataset unit strings like "1 piece (40g)", "1 plate (250g)", "100g cooked"
 * into a structured serving so the client can offer a "pieces" stepper in addition to grams.
 */
function parseServing(unit: string): ServingInfo {
  const match = unit.match(/^1\s+([a-zA-Z]+)\s*\((\d+(?:\.\d+)?)g\)/);
  if (!match) return { pieceLabel: null, pieceGrams: null };
  return { pieceLabel: match[1], pieceGrams: Number(match[2]) };
}

const INDIAN_FOODS: IndianFood[] = (indianFoodsData as Omit<IndianFood, 'id'>[]).map((food, i) => ({
  id: `in_${i}`,
  ...food,
}));

const servingById = new Map(INDIAN_FOODS.map((f) => [f.id, parseServing(f.unit)]));

const byId = new Map(INDIAN_FOODS.map((f) => [f.id, f]));

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[()]/g, '');
}

function score(food: IndianFood, query: string): number {
  const q = normalize(query);
  const name = normalize(food.name);

  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (name.includes(q)) return 60;

  for (const alias of food.aliases) {
    const a = normalize(alias);
    if (a === q) return 95;
    if (a.startsWith(q)) return 70;
    if (a.includes(q)) return 50;
  }

  // Word-level match (e.g. "chicken curry" query matches "curry" tokens)
  const qWords = q.split(/\s+/).filter(Boolean);
  const nameWords = name.split(/\s+/);
  const matchedWords = qWords.filter((w) => nameWords.some((nw) => nw.includes(w)));
  if (matchedWords.length > 0) return 20 + matchedWords.length * 10;

  return 0;
}

export const indianFoodsService = {
  search(query: string, limit = 10): IndianFood[] {
    if (!query || query.trim().length === 0) return [];

    const scored = INDIAN_FOODS.map((food) => ({ food, s: score(food, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit);

    return scored.map((x) => x.food);
  },

  getById(id: string): IndianFood | undefined {
    return byId.get(id);
  },

  getServing(id: string): ServingInfo {
    return servingById.get(id) ?? { pieceLabel: null, pieceGrams: null };
  },

  getAll(): IndianFood[] {
    return INDIAN_FOODS;
  },
};
