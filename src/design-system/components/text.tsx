import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme-provider';
import type { TypographyToken } from '../tokens';

export type TextTone =
  'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'onAccent';

export type TextProps = RNTextProps & {
  variant?: TypographyToken;
  tone?: TextTone;
};

const TONE_TO_COLOR = {
  primary: 'textPrimary',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  onAccent: 'textOnAccent',
} as const satisfies Record<TextTone, string>;

export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  const theme = useTheme();

  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: theme.colors[TONE_TO_COLOR[tone]] },
        variant === 'metric' && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
