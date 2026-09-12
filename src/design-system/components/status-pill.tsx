import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme-provider';
import { Text } from './text';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type StatusPillProps = {
  label: string;
  tone?: StatusTone;
  testID?: string;
};

/**
 * Compact state marker: asset online or offline, alert severity, invite pending.
 * The dot carries the colour so the label stays legible at small sizes.
 */
export function StatusPill({ label, tone = 'neutral', testID }: StatusPillProps) {
  const theme = useTheme();

  const toneColor = {
    neutral: theme.colors.textMuted,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    info: theme.colors.info,
  }[tone];

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.pill,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: toneColor }]} />
      <Text variant="label" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
