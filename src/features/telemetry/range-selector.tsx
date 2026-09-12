import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, useTheme } from '@/design-system';

import { RANGE_KEYS, type RangeKey } from './range';

const LABEL_KEYS = {
  day: 'dashboard.rangeDay',
  week: 'dashboard.rangeWeek',
  month: 'dashboard.rangeMonth',
} as const satisfies Record<RangeKey, string>;

export function RangeSelector({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', gap: theme.spacing.sm }}
      testID="range-selector"
    >
      {RANGE_KEYS.map((range) => (
        <Button
          key={range}
          label={t(LABEL_KEYS[range])}
          variant={value === range ? 'primary' : 'secondary'}
          onPress={() => onChange(range)}
          style={{ flex: 1 }}
          testID={`range-${range}`}
        />
      ))}
    </View>
  );
}
