import { skipToken } from '@reduxjs/toolkit/query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { useListHouseholdAlertsQuery } from '@/api/generated/endpoints';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Screen, Text, useTheme } from '@/design-system';
import { type AlertFilter, AlertFilters } from '@/features/alerts/alert-filters';
import { sortForInbox } from '@/features/alerts/alert-presentation';
import { AlertRow } from '@/features/alerts/alert-row';
import { useSelectedHousehold } from '@/features/household/use-selected-household';

/** Alerts are small and change on their own, so this is the one list worth polling. */
export const ALERT_POLL_MS = 30_000;

export default function AlertsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const { household, isLoading, error, refetch } = useSelectedHousehold();
  const [filter, setFilter] = useState<AlertFilter>('open');

  const alerts = useListHouseholdAlertsQuery(
    household
      ? { householdId: household.id, ...(filter === 'all' ? {} : { status: filter }) }
      : skipToken,
    { pollingInterval: ALERT_POLL_MS },
  );

  const rows = useMemo(() => sortForInbox(alerts.data?.data ?? []), [alerts.data]);

  if (isLoading) {
    return (
      <Screen testID="consumer-alerts">
        <LoadingState testID="alerts-loading" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen testID="consumer-alerts">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  if (!household) {
    return (
      <Screen testID="consumer-alerts">
        <Text variant="display">{t('alerts.title')}</Text>
        <EmptyState
          title={t('household.emptyTitle')}
          description={t('household.emptyDescription')}
          testID="no-household"
        />
      </Screen>
    );
  }

  return (
    <Screen testID="consumer-alerts">
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="display">{t('alerts.title')}</Text>
        <AlertFilters value={filter} onChange={setFilter} />
      </View>

      {alerts.isLoading ? (
        <LoadingState testID="alert-list-loading" />
      ) : alerts.error ? (
        <ErrorState error={alerts.error} onRetry={() => void alerts.refetch()} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(alert) => alert.id}
          contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={alerts.isFetching && !alerts.isLoading}
              onRefresh={() => void alerts.refetch()}
              tintColor={theme.colors.textMuted}
            />
          }
          renderItem={({ item }) => (
            <AlertRow alert={item} onPress={() => router.push(`/consumer/alert/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('alerts.emptyTitle')}
              description={
                filter === 'open' ? t('alerts.emptyDescription') : t('alerts.emptyFiltered')
              }
              testID="alerts-empty"
            />
          }
        />
      )}
    </Screen>
  );
}
