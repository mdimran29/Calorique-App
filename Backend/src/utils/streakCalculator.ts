// src/utils/streakCalculator.ts — Consecutive-day streak calculation from logged dates
import { subDays, format, parseISO, differenceInCalendarDays } from 'date-fns';

/**
 * Given a set of dates (YYYY-MM-DD) a user logged activity on, compute the current
 * streak (consecutive days ending today or yesterday) and the longest streak overall.
 */
export function calculateStreaks(loggedDates: string[]): { currentStreak: number; longestStreak: number } {
  if (loggedDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const uniqueSorted = Array.from(new Set(loggedDates)).sort();

  let longestStreak = 1;
  let running = 1;
  for (let i = 1; i < uniqueSorted.length; i++) {
    const diff = differenceInCalendarDays(parseISO(uniqueSorted[i]), parseISO(uniqueSorted[i - 1]));
    if (diff === 1) {
      running += 1;
    } else if (diff > 1) {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
  }

  // Current streak: walk backwards from today (or yesterday, so a not-yet-logged
  // today doesn't zero out an active streak) while consecutive days are present.
  const dateSet = new Set(uniqueSorted);
  const today = new Date();
  let cursor = dateSet.has(format(today, 'yyyy-MM-dd')) ? today : subDays(today, 1);
  let currentStreak = 0;
  while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
    currentStreak += 1;
    cursor = subDays(cursor, 1);
  }

  return { currentStreak, longestStreak };
}
