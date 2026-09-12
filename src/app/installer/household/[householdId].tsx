import { skipToken } from '@reduxjs/toolkit/query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import {
  useGetHouseholdQuery,
  useListHouseholdAlertsQuery,
  useListHouseholdAssetsQuery,
} from '@/api/generated/endpoints';
import { ErrorState, LoadingState } from '@/components/states';
import { Button, Screen, StatusPill, Surface, Text, useTheme } from '@/design-system';
import { sortForInbox } from '@/features/alerts/alert-presentation';
import { AlertRow } from '@/features/alerts/alert-row';
import { ASSET_STATUS_PRESENTATION } from '@/features/assets/asset-status';
import { formatRelativeTime } from '@/lib/format-energy';

/**
 * One household as an installer sees it: what is installed, what is wrong, and a way
 * into each device's log. Nothing here manages membership or billing, which the server
 * does not expose to this role anyway.
 */
export default function InstallerHouseholdScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const { householdId } = useLocalSearchParams<{ householdId: string }>();
  const household = useGetHouseholdQuery(householdId ? { householdId } : skipToken);
  const assets = useListHouseholdAssetsQuery(householdId ? { householdId } : skipToken);
  const alerts = useListHouseholdAlertsQuery(
    householdId ? { householdId, status: 'open' } : skipToken,
  );

  const openAlerts = useMemo(() => sortForInbox(alerts.data?.data ?? []), [alerts.data]);

  if (household.isLoading) {
    return (
      <Screen testID="installer-household">
        <LoadingState testID="installer-household-loading" />
      </Screen>
    );
  }

  if (household.error || !household.data) {
    return (
      <Screen testID="installer-household">
        <ErrorState error={household.error} onRetry={() => void household.refetch()} />
        <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen testID="installer-household">
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="display">{household.data.name}</Text>

        <Surface gap="md" testID="installer-household-alerts">
          <Text variant="heading">{t('installer.openFaultsHeading')}</Text>
          {alerts.isLoading ? (
            <LoadingState />
          ) : alerts.error ? (
            <ErrorState error={alerts.error} onRetry={() => void alerts.refetch()} />
          ) : openAlerts.length === 0 ? (
            <Text tone="secondary">{t('installer.noFaults')}</Text>
          ) : (
            openAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onPress={() => router.push(`/logs/${alert.assetId}`)}
              />
            ))
          )}
        </Surface>

        <Surface gap="md" testID="installer-household-assets">
          <Text variant="heading">{t('assets.title')}</Text>
          {assets.isLoading ? (
            <LoadingState />
          ) : assets.error ? (
            <ErrorState error={assets.error} onRetry={() => void assets.refetch()} />
          ) : (
            (assets.data?.data ?? []).map((asset) => {
              const status = ASSET_STATUS_PRESENTATION[asset.status];

              return (
                <Pressable
                  key={asset.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${asset.name}, ${t(status.labelKey)}`}
                  onPress={() => router.push(`/logs/${asset.id}`)}
                  testID={`installer-asset-${asset.id}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  }}
                >
                  <View style={{ gap: 2, flexShrink: 1 }}>
                    <Text variant="heading">{asset.name}</Text>
                    <Text variant="caption" tone="muted">
                      {t('assets.lastSeen', { time: formatRelativeTime(asset.lastSeenAt) })}
                    </Text>
                  </View>
                  <StatusPill label={t(status.labelKey)} tone={status.tone} />
                </Pressable>
              );
            })
          )}
        </Surface>

        <Button
          label={t('common.back')}
          variant="ghost"
          testID="installer-household-back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}
