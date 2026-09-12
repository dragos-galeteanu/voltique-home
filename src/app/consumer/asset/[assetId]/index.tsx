import { skipToken } from '@reduxjs/toolkit/query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import {
  useGetAssetQuery,
  useGetAssetTelemetryQuery,
  useListAssetLogsQuery,
} from '@/api/generated/endpoints';
import { ErrorState, LoadingState } from '@/components/states';
import { Button, Screen, StatusPill, Surface, Text, useTheme } from '@/design-system';
import { ASSET_STATUS_PRESENTATION } from '@/features/assets/asset-status';
import { useSelectedHousehold } from '@/features/household/use-selected-household';
import { formatWindowLabel } from '@/features/telemetry/axis';
import { EnergyChart } from '@/features/telemetry/energy-chart';
import { MetricTile } from '@/features/telemetry/metric-tile';
import { buildWindow, type RangeKey } from '@/features/telemetry/range';
import { RangeSelector } from '@/features/telemetry/range-selector';
import { integrateEnergyWh, mergeSeries, peakValue } from '@/features/telemetry/series';
import { formatEnergy, formatPercent, formatPower, formatRelativeTime } from '@/lib/format-energy';

const LIVE_POLL_MS = 60_000;
const RECENT_EVENT_COUNT = 5;

/** One asset: what it is doing now, how it behaved over the range, and what it reported. */
export default function AssetDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const { household } = useSelectedHousehold();

  const [range, setRange] = useState<RangeKey>('day');
  const [anchor] = useState(() => Date.now());

  const asset = useGetAssetQuery(assetId ? { assetId } : skipToken);
  const timeZone = household?.timezone ?? 'UTC';

  const window = useMemo(
    () => buildWindow(range, timeZone, new Date(anchor)),
    [anchor, range, timeZone],
  );

  const telemetry = useGetAssetTelemetryQuery(
    assetId
      ? {
          assetId,
          from: window.from,
          to: window.to,
          resolution: window.resolution,
          metrics: ['power', 'stateOfCharge'],
        }
      : skipToken,
    { pollingInterval: range === 'day' ? LIVE_POLL_MS : 0 },
  );

  const logs = useListAssetLogsQuery(assetId ? { assetId, limit: RECENT_EVENT_COUNT } : skipToken);

  const rows = useMemo(() => mergeSeries(telemetry.data?.series ?? []), [telemetry.data]);
  const powerSeries = telemetry.data?.series.find((series) => series.metric === 'power');
  const chargeSeries = telemetry.data?.series.find((series) => series.metric === 'stateOfCharge');

  if (asset.isLoading) {
    return (
      <Screen testID="asset-detail">
        <LoadingState testID="asset-loading" />
      </Screen>
    );
  }

  if (asset.error || !asset.data) {
    return (
      <Screen testID="asset-detail">
        <ErrorState error={asset.error} onRetry={() => void asset.refetch()} />
        <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const status = ASSET_STATUS_PRESENTATION[asset.data.status];

  return (
    <Screen testID="asset-detail">
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="display">{asset.data.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
            <StatusPill
              label={t(status.labelKey)}
              tone={status.tone}
              testID="asset-detail-status"
            />
            <Text variant="caption" tone="muted">
              {t('assets.lastSeen', { time: formatRelativeTime(asset.data.lastSeenAt) })}
            </Text>
          </View>
        </View>

        <RangeSelector value={range} onChange={setRange} />

        <Surface gap="md">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="heading">{t('assetDetail.power')}</Text>
            <Text variant="label" tone="muted">
              {formatWindowLabel(range, window.from, timeZone)}
            </Text>
          </View>

          {telemetry.isLoading ? (
            <LoadingState />
          ) : telemetry.error ? (
            <ErrorState error={telemetry.error} onRetry={() => void telemetry.refetch()} />
          ) : rows.length > 0 ? (
            <EnergyChart
              rows={rows}
              range={range}
              timeZone={timeZone}
              testID="asset-power-chart"
              metrics={[
                {
                  key: 'power',
                  color:
                    asset.data.category === 'production'
                      ? theme.colors.production
                      : theme.colors.consumption,
                  filled: true,
                },
              ]}
            />
          ) : (
            <Text tone="secondary" testID="asset-telemetry-empty">
              {t('dashboard.noData')}
            </Text>
          )}
        </Surface>

        {chargeSeries ? (
          <Surface gap="md">
            <Text variant="heading">{t('assetDetail.stateOfCharge')}</Text>
            <EnergyChart
              rows={rows}
              range={range}
              timeZone={timeZone}
              domain={[0, 100]}
              height={160}
              testID="asset-charge-chart"
              metrics={[{ key: 'stateOfCharge', color: theme.colors.battery, filled: true }]}
            />
          </Surface>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          <MetricTile
            label={t('assets.now')}
            value={formatPower(asset.data.latestReading?.powerW)}
            testID="asset-tile-now"
          />
          <MetricTile
            label={t('dashboard.peak')}
            value={formatPower(peakValue(powerSeries))}
            testID="asset-tile-peak"
          />
          <MetricTile
            label={t('assetDetail.overRange')}
            value={formatEnergy(integrateEnergyWh(powerSeries, window.resolution, window.to))}
            testID="asset-tile-energy"
          />
          {asset.data.latestReading?.stateOfChargePercent != null ? (
            <MetricTile
              label={t('dashboard.battery')}
              value={formatPercent(asset.data.latestReading.stateOfChargePercent)}
              accent={theme.colors.battery}
              testID="asset-tile-charge"
            />
          ) : null}
        </View>

        <Surface gap="md" testID="asset-recent-events">
          <Text variant="heading">{t('assetDetail.recentEvents')}</Text>
          {logs.isLoading ? (
            <LoadingState />
          ) : logs.error ? (
            <ErrorState error={logs.error} onRetry={() => void logs.refetch()} />
          ) : (logs.data?.data ?? []).length === 0 ? (
            <Text tone="secondary">{t('assetDetail.noEvents')}</Text>
          ) : (
            (logs.data?.data ?? []).map((entry) => (
              <View key={entry.id} style={{ gap: 2 }}>
                <Text variant="caption" tone="muted">
                  {formatRelativeTime(entry.ts)}
                  {entry.code ? ` · ${entry.code}` : ''}
                </Text>
                <Text
                  tone={
                    entry.severity === 'error' || entry.severity === 'critical'
                      ? 'danger'
                      : entry.severity === 'warning'
                        ? 'warning'
                        : 'primary'
                  }
                >
                  {entry.message}
                </Text>
              </View>
            ))
          )}
        </Surface>

        <Button
          label={t('common.back')}
          variant="ghost"
          testID="asset-detail-back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}
