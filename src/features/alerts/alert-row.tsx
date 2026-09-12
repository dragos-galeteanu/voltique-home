import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Alert } from '@/api/generated/endpoints';
import { StatusPill, Surface, Text, useTheme } from '@/design-system';
import { formatRelativeTime } from '@/lib/format-energy';

import { ALERT_SEVERITY_PRESENTATION, ALERT_STATUS_PRESENTATION } from './alert-presentation';

export function AlertRow({ alert, onPress }: { alert: Alert; onPress: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  const severity = ALERT_SEVERITY_PRESENTATION[alert.severity];
  const status = ALERT_STATUS_PRESENTATION[alert.status];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${alert.title}, ${t(severity.labelKey)}, ${t(status.labelKey)}`}
      onPress={onPress}
      testID={`alert-row-${alert.id}`}
    >
      <Surface gap="md" style={{ opacity: alert.status === 'resolved' ? 0.6 : 1 }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <StatusPill label={t(severity.labelKey)} tone={severity.tone} />
          <StatusPill label={t(status.labelKey)} tone={status.tone} />
        </View>

        <View style={{ gap: 2 }}>
          <Text variant="heading">{alert.title}</Text>
          <Text variant="caption" tone="muted">
            {alert.assetName ?? ''}
          </Text>
        </View>

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}
        >
          <Text variant="caption" tone="muted">
            {t('alerts.lastSeen', { time: formatRelativeTime(alert.lastSeenAt) })}
          </Text>
          <Text variant="caption" tone="muted">
            {t('alerts.occurrences', { count: alert.occurrences })}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
}
