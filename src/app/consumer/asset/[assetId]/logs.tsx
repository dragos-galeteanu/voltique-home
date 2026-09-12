import { skipToken } from '@reduxjs/toolkit/query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, View } from 'react-native';

import type { LogEntry, LogSeverity } from '@/api/generated/endpoints';
import { useListAssetLogsQuery } from '@/api/generated/endpoints';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button, Screen, StatusPill, Surface, Text, useTheme } from '@/design-system';
import { formatRelativeTime } from '@/lib/format-energy';

const SEVERITIES = ['debug', 'info', 'warning', 'error', 'critical'] as const;

const SEVERITY_TONE = {
  debug: 'neutral',
  info: 'info',
  warning: 'warning',
  error: 'danger',
  critical: 'danger',
} as const;

/**
 * The raw event stream from one asset, newest first. Paged by cursor because it is
 * effectively endless, and filtered by a minimum severity so an installer can skip the
 * chatter without losing it.
 */
export default function AssetLogsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const { assetId } = useLocalSearchParams<{ assetId: string }>();
  const [minSeverity, setMinSeverity] = useState<LogSeverity | undefined>(undefined);
  const [pages, setPages] = useState<LogEntry[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const logs = useListAssetLogsQuery(
    assetId ? { assetId, ...(minSeverity ? { severity: minSeverity } : {}), cursor } : skipToken,
  );

  /** Pages are appended locally; the query cache holds one page at a time. */
  const entries = useMemo(
    () => (cursor ? [...pages, ...(logs.data?.data ?? [])] : (logs.data?.data ?? [])),
    [cursor, logs.data, pages],
  );
  const nextCursor = logs.data?.nextCursor ?? null;

  const loadMore = useCallback(() => {
    if (!nextCursor || logs.isFetching) return;
    setPages(entries);
    setCursor(nextCursor);
  }, [entries, logs.isFetching, nextCursor]);

  function changeSeverity(next: LogSeverity | undefined) {
    setPages([]);
    setCursor(undefined);
    setMinSeverity(next);
  }

  return (
    <Screen testID="asset-logs">
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="display">{t('logs.title')}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.sm }}
          testID="log-severity-filters"
        >
          <Button
            label={t('logs.filterAll')}
            variant={minSeverity === undefined ? 'primary' : 'secondary'}
            onPress={() => changeSeverity(undefined)}
            testID="log-severity-all"
          />
          {SEVERITIES.map((severity) => (
            <Button
              key={severity}
              label={t(`logs.severity.${severity}`)}
              variant={minSeverity === severity ? 'primary' : 'secondary'}
              onPress={() => changeSeverity(severity)}
              testID={`log-severity-${severity}`}
            />
          ))}
        </ScrollView>
      </View>

      {logs.isLoading && entries.length === 0 ? (
        <LoadingState testID="logs-loading" />
      ) : logs.error ? (
        <ErrorState error={logs.error} onRetry={() => void logs.refetch()} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => entry.id}
          contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          renderItem={({ item }) => <LogRow entry={item} />}
          ListEmptyComponent={
            <EmptyState title={t('logs.title')} description={t('logs.empty')} testID="logs-empty" />
          }
          ListFooterComponent={
            nextCursor ? (
              <Button
                label={t('logs.loadMore')}
                variant="secondary"
                loading={logs.isFetching}
                onPress={loadMore}
                testID="logs-load-more"
              />
            ) : null
          }
        />
      )}

      <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Surface gap="sm" testID={`log-row-${entry.id}`}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
        <StatusPill
          label={t(`logs.severity.${entry.severity}`)}
          tone={SEVERITY_TONE[entry.severity]}
        />
        <Text variant="caption" tone="muted">
          {formatRelativeTime(entry.ts)}
        </Text>
        {entry.code ? (
          <Text variant="caption" tone="muted">
            {entry.code}
          </Text>
        ) : null}
      </View>

      <Text>{entry.message}</Text>

      <Text variant="caption" tone="muted">
        {t(`logs.source.${entry.source}`)}
      </Text>
    </Surface>
  );
}
