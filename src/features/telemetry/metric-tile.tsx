import { View } from 'react-native';

import { Surface, Text, useTheme } from '@/design-system';

export type MetricTileProps = {
  label: string;
  value: string;
  /** A coloured dot tying the figure to its series in the chart. */
  accent?: string;
  caption?: string;
  testID?: string;
};

export function MetricTile({ label, value, accent, caption, testID }: MetricTileProps) {
  const theme = useTheme();

  return (
    <Surface gap="xs" padding="lg" style={{ flexGrow: 1, flexBasis: '45%' }} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {accent ? (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
        ) : null}
        <Text variant="label" tone="muted">
          {label}
        </Text>
      </View>
      <Text variant="metric">{value}</Text>
      {caption ? (
        <Text variant="caption" tone="muted">
          {caption}
        </Text>
      ) : null}
    </Surface>
  );
}
