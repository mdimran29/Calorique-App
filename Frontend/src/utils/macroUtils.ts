// utils/macroUtils.ts — Macro percentage calculators and BMR/TDEE helpers

import type { Macros } from '../types/meal.types';
import { CALORIES_PER_GRAM } from './constants';

/**
 * Calculate calories from macros
 */
export function calcCaloriesFromMacros(macros: Omit<Macros, 'calories'>): number {
  return (
    macros.protein * CALORIES_PER_GRAM.protein +
    macros.carbs   * CALORIES_PER_GRAM.carbs   +
    macros.fat     * CALORIES_PER_GRAM.fat
  );
}

/**
 * Calculate macro percentages of total calories
 */
export function calcMacroPercentages(macros: Macros): {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
} {
  const total = macros.calories || calcCaloriesFromMacros(macros);
  if (total === 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };

  return {
    proteinPct: Math.round((macros.protein * CALORIES_PER_GRAM.protein / total) * 100),
    carbsPct:   Math.round((macros.carbs   * CALORIES_PER_GRAM.carbs   / total) * 100),
    fatPct:     Math.round((macros.fat     * CALORIES_PER_GRAM.fat     / total) * 100),
  };
}

/**
 * Scale macros by portion ratio
 */
export function scaleMacros(macros: Macros, portionGrams: number, baseSizeGrams = 100): Macros {
  const ratio = portionGrams / baseSizeGrams;
  return {
    calories: Math.round(macros.calories * ratio * 10) / 10,
    protein:  Math.round(macros.protein  * ratio * 10) / 10,
    carbs:    Math.round(macros.carbs    * ratio * 10) / 10,
    fat:      Math.round(macros.fat      * ratio * 10) / 10,
    fiber:    macros.fiber != null ? Math.round(macros.fiber * ratio * 10) / 10 : undefined,
  };
}

/**
 * Sum multiple macros objects
 */
export function sumMacros(macrosList: Macros[]): Macros {
  return macrosList.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein:  acc.protein  + m.protein,
      carbs:    acc.carbs    + m.carbs,
      fat:      acc.fat      + m.fat,
      fiber:    (acc.fiber ?? 0) + (m.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Mifflin-St Jeor BMR formula
 */
export function calcBMR(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  gender: 'male' | 'female' | 'other'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return gender === 'female' ? base - 161 : base + 5;
}

/**
 * TDEE = BMR × activity multiplier
 */
export function calcTDEE(bmr: number, activityMultiplier: number): number {
  return Math.round(bmr * activityMultiplier);
}

/**
 * Macro split for a given goal and calorie target
 */
export function calcMacroSplit(
  dailyCalories: number,
  goal: 'muscle_gain' | 'fat_loss' | 'lean_bulk' | 'maintenance',
  weightKg: number
): Macros {
  // Protein: 1.8–2.2 g/kg for muscle goals, 1.6 for others
  const proteinGPerKg = goal === 'muscle_gain' || goal === 'lean_bulk' ? 2.0 : 1.6;
  const protein = Math.round(weightKg * proteinGPerKg);
  const proteinCal = protein * CALORIES_PER_GRAM.protein;

  // Fat: 25–30% of calories
  const fatCal  = Math.round(dailyCalories * 0.27);
  const fat      = Math.round(fatCal / CALORIES_PER_GRAM.fat);

  // Carbs: remainder
  const carbsCal = dailyCalories - proteinCal - fatCal;
  const carbs    = Math.round(Math.max(0, carbsCal) / CALORIES_PER_GRAM.carbs);

  return { calories: dailyCalories, protein, carbs, fat };
}

/**
 * Progress percentage (0–100, capped)
 */
export function progressPct(current: number, goal: number): number {
  if (goal === 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}
