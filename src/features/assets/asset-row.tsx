import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Asset } from '@/api/generated/endpoints';
import { StatusPill, Surface, Text, useTheme } from '@/design-system';
import { formatEnergy, formatPower, formatRelativeTime } from '@/lib/format-energy';

import { ASSET_STATUS_PRESENTATION } from './asset-status';

export function AssetRow({
  asset,
  onPress,
  onLongPress,
}: {
  asset: Asset;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  const status = ASSET_STATUS_PRESENTATION[asset.status];
  const statusLabel = t(status.labelKey);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${asset.name}, ${statusLabel}`}
      accessibilityHint={t('assets.holdToRemove')}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={`asset-row-${asset.id}`}
    >
      <Surface gap="md">
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}
        >
          <View style={{ flexShrink: 1, gap: 2 }}>
            <Text variant="heading" numberOfLines={1}>
              {asset.name}
            </Text>
            <Text variant="caption" tone="muted">
              {t('assets.lastSeen', { time: formatRelativeTime(asset.lastSeenAt) })}
            </Text>
          </View>
          <StatusPill label={statusLabel} tone={status.tone} testID={`asset-status-${asset.id}`} />
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.xl }}>
          <Reading label={t('assets.now')} value={formatPower(asset.latestReading?.powerW)} />
          <Reading
            label={t('assets.today')}
            value={formatEnergy(asset.latestReading?.energyTodayWh)}
          />
        </View>
      </Surface>
    </Pressable>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="heading">{value}</Text>
    </View>
  );
}
