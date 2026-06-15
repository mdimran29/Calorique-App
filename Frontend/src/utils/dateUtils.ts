// utils/dateUtils.ts — Date manipulation helpers

/**
 * Get today as YYYY-MM-DD string
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday as YYYY-MM-DD string
 */
export function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Add N days to a date (YYYY-MM-DD → YYYY-MM-DD)
 */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/**
 * Subtract N days from a date
 */
export function subtractDays(dateStr: string, n: number): string {
  return addDays(dateStr, -n);
}

/**
 * Get the last N days as YYYY-MM-DD strings (most recent last)
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(subtractDays(today(), i));
  }
  return dates;
}

/**
 * Get the start of the current week (Monday)
 */
export function startOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();                          // 0 = Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);  // adjust to Monday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get an array of dates for the current week (Mon–Sun)
 */
export function getCurrentWeekDates(): string[] {
  const mon = startOfWeek();
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/**
 * Check if two YYYY-MM-DD strings are the same day
 */
export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

/**
 * Check if a date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === today();
}

/**
 * Difference in days between two YYYY-MM-DD strings (b - a)
 */
export function diffDays(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

/**
 * Day of the week label for a date: 'Mon', 'Tue', etc.
 */
export function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });
}

/**
 * Month label: 'Jan', 'Feb', etc.
 */
export function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short' });
}
