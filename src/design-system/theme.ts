import { motion, palette, radius, spacing, typography } from './tokens';

/**
 * Semantic colour roles. Screens name the role they need, never a raw palette entry.
 * The energy roles are fixed meanings across the app: production is always the same
 * colour in a chart, a status pill and a legend.
 */
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;

  accent: string;
  accentMuted: string;

  success: string;
  warning: string;
  danger: string;
  info: string;

  /** Energy semantics, shared by charts, pills and legends. */
  production: string;
  consumption: string;
  battery: string;
  gridImport: string;

  overlay: string;
};

export type Theme = {
  name: 'light' | 'dark';
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
};

const shared = { spacing, radius, typography, motion } as const;

export const darkTheme: Theme = {
  name: 'dark',
  ...shared,
  colors: {
    background: palette.neutral950,
    surface: palette.neutral900,
    surfaceElevated: palette.neutral800,
    border: palette.neutral800,
    borderStrong: palette.neutral700,

    textPrimary: palette.neutral50,
    textSecondary: palette.neutral400,
    textMuted: palette.neutral500,
    textOnAccent: palette.neutral950,

    accent: palette.brand400,
    accentMuted: 'rgba(56, 189, 248, 0.16)',

    success: palette.green400,
    warning: palette.amber400,
    danger: palette.red400,
    info: palette.brand300,

    production: palette.green400,
    consumption: palette.brand400,
    battery: palette.violet400,
    gridImport: palette.amber400,

    overlay: 'rgba(2, 6, 23, 0.72)',
  },
};

export const lightTheme: Theme = {
  name: 'light',
  ...shared,
  colors: {
    background: palette.neutral50,
    surface: palette.neutral0,
    surfaceElevated: palette.neutral0,
    border: palette.neutral200,
    borderStrong: palette.neutral300,

    textPrimary: palette.neutral900,
    textSecondary: palette.neutral600,
    textMuted: palette.neutral500,
    textOnAccent: palette.neutral0,

    accent: palette.brand600,
    accentMuted: 'rgba(2, 132, 199, 0.12)',

    success: palette.green600,
    warning: palette.amber600,
    danger: palette.red600,
    info: palette.brand500,

    production: palette.green600,
    consumption: palette.brand600,
    battery: palette.violet500,
    gridImport: palette.amber600,

    overlay: 'rgba(15, 23, 42, 0.45)',
  },
};
