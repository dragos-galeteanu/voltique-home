import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../theme-provider';
import { Text, type TextTone } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Rendered before the label, typically an icon. */
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leading,
  style,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const background: Record<ButtonVariant, string> = {
    primary: theme.colors.accent,
    secondary: theme.colors.surfaceElevated,
    ghost: 'transparent',
    danger: theme.colors.danger,
  };

  const labelTone: Record<ButtonVariant, TextTone> = {
    primary: 'onAccent',
    secondary: 'primary',
    ghost: 'accent',
    danger: 'onAccent',
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: background[variant],
          borderColor: variant === 'secondary' ? theme.colors.borderStrong : 'transparent',
          borderRadius: theme.radius.md,
          minHeight: size === 'lg' ? 52 : 44,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.sm,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'danger'
              ? theme.colors.textOnAccent
              : theme.colors.accent
          }
          size="small"
        />
      ) : (
        <>
          {leading ? <View>{leading}</View> : null}
          <Text variant="heading" tone={labelTone[variant]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
