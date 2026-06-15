// utils/colors.ts — Color palette constants (from frontend.md spec)

export const COLORS = {
  // Primary palette
  primary:      '#4CAF50',  // Green — health/nutrition theme
  primaryDark:  '#388E3C',
  primaryLight: '#81C784',
  secondary:    '#FF9800',  // Orange — energy/calories
  secondaryDark:'#F57C00',
  accent:       '#2196F3',  // Blue — hydration

  // Backgrounds
  background:   '#F5F5F5',
  surface:      '#FFFFFF',
  darkBg:       '#121212',
  darkSurface:  '#1E1E1E',
  darkCard:     'rgba(28, 28, 30, 0.75)',

  // Text
  text:         '#212121',
  textLight:    '#757575',
  darkText:     '#E0E0E0',
  darkTextMuted:'#757575',

  // Semantic
  error:        '#F44336',
  success:      '#4CAF50',
  warning:      '#FFC107',
  info:         '#2196F3',
  border:       '#E0E0E0',
  darkBorder:   'rgba(255, 255, 255, 0.07)',

  // Macro colors
  protein:      '#E91E63',   // Pink
  carbs:        '#FF9800',   // Orange
  fats:         '#9C27B0',   // Purple
  fiber:        '#795548',   // Brown
  calories:     '#FF6B35',   // Deep Orange

  // UI specific
  gold:         '#D4AF37',
  streak:       '#FF9800',
  water:        '#2196F3',

  // Glassmorphism card
  glass: {
    background: 'rgba(28, 28, 30, 0.75)',
    border:     'rgba(255, 255, 255, 0.07)',
    shadow:     'rgba(0, 0, 0, 0.4)',
  },
} as const;

export type ColorKey = keyof typeof COLORS;

// Macro color map for quick lookup
export const MACRO_COLORS = {
  protein: COLORS.protein,
  carbs:   COLORS.carbs,
  fat:     COLORS.fats,
  fiber:   COLORS.fiber,
  calories:COLORS.calories,
} as const;
