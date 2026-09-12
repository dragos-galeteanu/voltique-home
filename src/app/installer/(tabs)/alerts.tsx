import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { useListAlertsQuery } from '@/api/generated/endpoints';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Screen, Text, useTheme } from '@/design-system';
import { type AlertFilter, AlertFilters } from '@/features/alerts/alert-filters';
import { sortForInbox } from '@/features/alerts/alert-presentation';
import { AlertRow } from '@/features/alerts/alert-row';

const POLL_MS = 30_000;

/** Faults across every household the installer maintains, worst first. */
export default function InstallerAlertsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<AlertFilter>('open');
  const alerts = useListAlertsQuery(filter === 'all' ? {} : { status: filter }, {
    pollingInterval: POLL_MS,
  });

  const rows = useMemo(() => sortForInbox(alerts.data?.data ?? []), [alerts.data]);

  return (
    <Screen testID="installer-alerts">
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="display">{t('alerts.title')}</Text>
        <AlertFilters value={filter} onChange={setFilter} />
      </View>

      {alerts.isLoading ? (
        <LoadingState testID="installer-alerts-loading" />
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
            <AlertRow
              alert={item}
              // An installer needs to know which home this is, which a consumer does not.
              subtitle={item.householdName}
              onPress={() => router.push(`/logs/${item.assetId}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('alerts.emptyTitle')}
              description={t('installer.noFaults')}
              testID="installer-alerts-empty"
            />
          }
        />
      )}
    </Screen>
  );
}
