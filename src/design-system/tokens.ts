/**
 * Raw design tokens. Nothing in the app imports these directly: screens read the
 * semantic roles exposed by the theme, so a palette change never touches a screen.
 */

export const palette = {
  // Neutral ramp, cool tinted to suit a dark-first energy dashboard.
  neutral0: '#FFFFFF',
  neutral50: '#F8FAFC',
  neutral100: '#F1F5F9',
  neutral200: '#E2E8F0',
  neutral300: '#CBD5E1',
  neutral400: '#94A3B8',
  neutral500: '#64748B',
  neutral600: '#475569',
  neutral700: '#334155',
  neutral800: '#1E293B',
  neutral900: '#0F172A',
  neutral950: '#0B1220',

  brand300: '#7DD3FC',
  brand400: '#38BDF8',
  brand500: '#0EA5E9',
  brand600: '#0284C7',

  green400: '#4ADE80',
  green500: '#22C55E',
  green600: '#16A34A',

  amber400: '#FBBF24',
  amber500: '#F59E0B',
  amber600: '#D97706',

  red400: '#F87171',
  red500: '#EF4444',
  red600: '#DC2626',

  violet400: '#A78BFA',
  violet500: '#8B5CF6',
} as const;

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  /** Tabular figures keep live readouts from jittering as digits change. */
  metric: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
} as const;

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radius;
export type TypographyToken = keyof typeof typography;
