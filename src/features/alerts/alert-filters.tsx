import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import type { AlertStatus } from '@/api/generated/endpoints';
import { Button, useTheme } from '@/design-system';

/** Undefined means every status, which is why it cannot simply be an AlertStatus. */
export type AlertFilter = AlertStatus | 'all';

const FILTERS = [
  { value: 'open', labelKey: 'alerts.filterOpen' },
  { value: 'acknowledged', labelKey: 'alerts.filterAcknowledged' },
  { value: 'resolved', labelKey: 'alerts.filterResolved' },
  { value: 'all', labelKey: 'alerts.filterAll' },
] as const satisfies readonly { value: AlertFilter; labelKey: string }[];

export function AlertFilters({
  value,
  onChange,
}: {
  value: AlertFilter;
  onChange: (filter: AlertFilter) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.spacing.sm }}
      testID="alert-filters"
    >
      {FILTERS.map((filter) => (
        <Button
          key={filter.value}
          label={t(filter.labelKey)}
          variant={value === filter.value ? 'primary' : 'secondary'}
          onPress={() => onChange(filter.value)}
          testID={`alert-filter-${filter.value}`}
        />
      ))}
    </ScrollView>
  );
}
