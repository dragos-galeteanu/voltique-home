import { useId, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '../theme-provider';
import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field, and read out as the accessibility error. */
  error?: string;
  hint?: string;
};

export function TextField({
  label,
  error,
  hint,
  onBlur,
  onFocus,
  testID,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const inputId = useId();

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.accent
      : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label" tone="secondary" nativeID={`${inputId}-label`}>
        {label}
      </Text>

      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={`${inputId}-label`}
        aria-invalid={Boolean(error)}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.accent}
        testID={testID}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          theme.typography.body,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor,
            borderRadius: theme.radius.md,
            color: theme.colors.textPrimary,
            paddingHorizontal: theme.spacing.lg,
          },
        ]}
        {...rest}
      />

      {error ? (
        <Text variant="caption" tone="danger" testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
