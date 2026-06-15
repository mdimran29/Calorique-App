// utils/formatters.ts — Date, number, calorie formatters

/**
 * Format a Date or ISO string to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format a date for display: "Monday, June 1, 2026"
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date short: "Jun 1"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/**
 * Format time: "9:41 AM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a calorie number with comma separator: 2100 → "2,100"
 */
export function formatCalories(cal: number): string {
  return Math.round(cal).toLocaleString('en-IN');
}

/**
 * Format macros: 85.4 → "85g"
 */
export function formatMacro(grams: number): string {
  return `${Math.round(grams)}g`;
}

/**
 * Format weight: 72.4 → "72.4 kg"
 */
export function formatWeight(kg: number, decimals = 1): string {
  return `${kg.toFixed(decimals)} kg`;
}

/**
 * Format percentage: 0.69 → "69%"
 */
export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/**
 * Format price in INR: 199 → "₹199"
 */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Format water: glasses to litres "2.50L"
 */
export function formatWater(glasses: number, mlPerGlass = 250): string {
  const litres = (glasses * mlPerGlass) / 1000;
  return `${litres.toFixed(2)}L`;
}

/**
 * Relative time: "2 hours ago", "just now"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}
