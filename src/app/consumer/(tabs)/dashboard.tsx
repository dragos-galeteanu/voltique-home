import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import {
  useGetHouseholdTelemetryQuery,
  useListHouseholdAssetsQuery,
} from '@/api/generated/endpoints';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Screen, Surface, Text, useTheme } from '@/design-system';
import { HouseholdSwitcher } from '@/features/household/household-switcher';
import { useSelectedHousehold } from '@/features/household/use-selected-household';
import { formatWindowLabel } from '@/features/telemetry/axis';
import { EnergyChart } from '@/features/telemetry/energy-chart';
import { MetricTile } from '@/features/telemetry/metric-tile';
import { buildWindow, type RangeKey } from '@/features/telemetry/range';
import { RangeSelector } from '@/features/telemetry/range-selector';
import { mergeSeries, summariseHousehold } from '@/features/telemetry/series';
import { formatEnergy, formatPercent, formatPower } from '@/lib/format-energy';

/** Only today keeps refreshing itself; a finished week or month will not change. */
const LIVE_POLL_MS = 60_000;

export default function DashboardScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const households = useSelectedHousehold();
  const household = households.household;

  const [range, setRange] = useState<RangeKey>('day');
  // Pinned so the window does not slide on every render, which would refetch endlessly.
  const [anchor, setAnchor] = useState(() => Date.now());

  const window = useMemo(
    () => (household ? buildWindow(range, household.timezone, new Date(anchor)) : null),
    [anchor, household, range],
  );

  const telemetry = useGetHouseholdTelemetryQuery(
    household && window
      ? {
          householdId: household.id,
          from: window.from,
          to: window.to,
          resolution: window.resolution,
          metrics: ['production', 'consumption', 'gridImport'],
        }
      : skipToken,
    { pollingInterval: range === 'day' ? LIVE_POLL_MS : 0 },
  );

  const assets = useListHouseholdAssetsQuery(household ? { householdId: household.id } : skipToken);

  const rows = useMemo(() => mergeSeries(telemetry.data?.series ?? []), [telemetry.data]);
  const summary = useMemo(
    () => summariseHousehold(telemetry.data, window?.to ?? new Date(anchor).toISOString()),
    [anchor, telemetry.data, window],
  );

  /** State of charge belongs to the storage asset, not to the household series. */
  const batteryPercent =
    assets.data?.data.find((asset) => asset.category === 'storage')?.latestReading
      ?.stateOfChargePercent ?? null;

  function refresh() {
    setAnchor(Date.now());
    void telemetry.refetch();
    void assets.refetch();
  }

  if (households.isLoading) {
    return (
      <Screen testID="consumer-dashboard">
        <LoadingState testID="dashboard-loading" />
      </Screen>
    );
  }

  if (households.error) {
    return (
      <Screen testID="consumer-dashboard">
        <ErrorState error={households.error} onRetry={() => void households.refetch()} />
      </Screen>
    );
  }

  if (!household) {
    return (
      <Screen testID="consumer-dashboard">
        <Text variant="display">{t('dashboard.title')}</Text>
        <EmptyState
          title={t('household.emptyTitle')}
          description={t('household.emptyDescription')}
          testID="no-household"
        />
      </Screen>
    );
  }

  const hasData = rows.length > 0;

  return (
    <Screen testID="consumer-dashboard">
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={telemetry.isFetching && !telemetry.isLoading}
            onRefresh={refresh}
            tintColor={theme.colors.textMuted}
          />
        }
      >
        <HouseholdSwitcher households={households.households} selected={household} />
        <RangeSelector value={range} onChange={setRange} />

        <Surface gap="md" testID="energy-chart-card">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="heading">{t('dashboard.energy')}</Text>
            <Text variant="label" tone="muted" testID="window-label">
              {window ? formatWindowLabel(range, window.from, household.timezone) : ''}
            </Text>
          </View>

          {telemetry.isLoading ? (
            <LoadingState testID="telemetry-loading" />
          ) : telemetry.error ? (
            <ErrorState error={telemetry.error} onRetry={() => void telemetry.refetch()} />
          ) : hasData ? (
            <>
              <EnergyChart
                rows={rows}
                range={range}
                timeZone={household.timezone}
                testID="energy-chart"
                metrics={[
                  { key: 'production', color: theme.colors.production, filled: true },
                  { key: 'consumption', color: theme.colors.consumption },
                ]}
              />
              <View style={{ flexDirection: 'row', gap: theme.spacing.lg }}>
                <Legend color={theme.colors.production} label={t('dashboard.production')} />
                <Legend color={theme.colors.consumption} label={t('dashboard.consumption')} />
              </View>
            </>
          ) : (
            <Text tone="secondary" testID="telemetry-empty">
              {t('dashboard.noData')}
            </Text>
          )}
        </Surface>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
          }}
        >
          <MetricTile
            label={t('dashboard.produced')}
            value={formatEnergy(summary.productionWh)}
            accent={theme.colors.production}
            testID="tile-produced"
          />
          <MetricTile
            label={t('dashboard.consumed')}
            value={formatEnergy(summary.consumptionWh)}
            accent={theme.colors.consumption}
            testID="tile-consumed"
          />
          <MetricTile
            label={t('dashboard.peak')}
            value={formatPower(summary.peakProductionW)}
            testID="tile-peak"
          />
          <MetricTile
            label={t('dashboard.fromGrid')}
            value={formatEnergy(summary.gridImportWh)}
            accent={theme.colors.gridImport}
            testID="tile-grid"
          />
          {batteryPercent != null ? (
            <MetricTile
              label={t('dashboard.battery')}
              value={formatPercent(batteryPercent)}
              accent={theme.colors.battery}
              testID="tile-battery"
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
      <View style={{ width: 10, height: 3, borderRadius: 2, backgroundColor: color }} />
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}
