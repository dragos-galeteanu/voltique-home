import { skipToken } from '@reduxjs/toolkit/query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import type { AlertStatus } from '@/api/generated/endpoints';
import { useGetAlertQuery, useListAssetLogsQuery } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { ErrorState, LoadingState } from '@/components/states';
import { Button, Screen, StatusPill, Surface, Text, useTheme, useToast } from '@/design-system';
import { useUpdateAlertStatusMutation } from '@/features/alerts/alert-endpoints';
import {
  ALERT_SEVERITY_PRESENTATION,
  ALERT_SOURCE_LABEL,
  ALERT_STATUS_PRESENTATION,
  nextActionsFor,
} from '@/features/alerts/alert-presentation';
import { formatRelativeTime } from '@/lib/format-energy';

const EVIDENCE_COUNT = 5;

/**
 * One alert, with the evidence behind it. The client can only acknowledge or resolve:
 * the server derived this and will reopen it on its own if the condition returns.
 */
export default function AlertDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const alert = useGetAlertQuery(alertId ? { alertId } : skipToken);
  const [updateStatus, { isLoading: updating }] = useUpdateAlertStatusMutation();

  const assetId = alert.data?.assetId;
  const evidence = useListAssetLogsQuery(
    assetId ? { assetId, severity: 'warning', limit: EVIDENCE_COUNT } : skipToken,
  );

  async function setStatus(status: Extract<AlertStatus, 'acknowledged' | 'resolved'>) {
    if (!alertId) return;

    try {
      await updateStatus({ alertId, alertStatusUpdate: { status } }).unwrap();
      showToast({
        message: status === 'acknowledged' ? t('alerts.acknowledged') : t('alerts.resolved'),
        tone: 'success',
      });
    } catch (error) {
      showToast({ message: getErrorMessage(error, t('alerts.actionFailed')), tone: 'danger' });
    }
  }

  if (alert.isLoading) {
    return (
      <Screen testID="alert-detail">
        <LoadingState testID="alert-loading" />
      </Screen>
    );
  }

  if (alert.error || !alert.data) {
    return (
      <Screen testID="alert-detail">
        <ErrorState error={alert.error} onRetry={() => void alert.refetch()} />
        <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  const severity = ALERT_SEVERITY_PRESENTATION[alert.data.severity];
  const status = ALERT_STATUS_PRESENTATION[alert.data.status];
  const actions = nextActionsFor(alert.data.status);

  return (
    <Screen testID="alert-detail">
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            <StatusPill label={t(severity.labelKey)} tone={severity.tone} />
            <StatusPill
              label={t(status.labelKey)}
              tone={status.tone}
              testID="alert-detail-status"
            />
          </View>
          <Text variant="display">{alert.data.title}</Text>
          {alert.data.detail ? <Text tone="secondary">{alert.data.detail}</Text> : null}
        </View>

        <Surface gap="md">
          <Fact
            label={t('alerts.derivedFrom')}
            value={t(ALERT_SOURCE_LABEL[alert.data.derivedFrom])}
          />
          <Fact
            label={t('alerts.firstSeen', { time: '' }).trim()}
            value={formatRelativeTime(alert.data.firstSeenAt)}
          />
          <Fact
            label={t('alerts.lastSeen', { time: '' }).trim()}
            value={formatRelativeTime(alert.data.lastSeenAt)}
          />
          <Fact
            label={t('alerts.occurrences', { count: alert.data.occurrences }).replace(
              String(alert.data.occurrences),
              '',
            )}
            value={String(alert.data.occurrences)}
          />
        </Surface>

        {actions.length > 0 ? (
          <View style={{ gap: theme.spacing.sm }}>
            {actions.includes('acknowledge') ? (
              <Button
                label={t('alerts.acknowledge')}
                loading={updating}
                onPress={() => void setStatus('acknowledged')}
                testID="alert-acknowledge"
              />
            ) : null}
            {actions.includes('resolve') ? (
              <Button
                label={t('alerts.resolve')}
                variant="secondary"
                loading={updating}
                onPress={() => void setStatus('resolved')}
                testID="alert-resolve"
              />
            ) : null}
          </View>
        ) : null}

        <Surface gap="md" testID="alert-evidence">
          <Text variant="heading">{t('alerts.evidence')}</Text>

          {evidence.isLoading ? (
            <LoadingState />
          ) : evidence.error ? (
            <ErrorState error={evidence.error} onRetry={() => void evidence.refetch()} />
          ) : (evidence.data?.data ?? []).length === 0 ? (
            <Text tone="secondary">{t('assetDetail.noEvents')}</Text>
          ) : (
            (evidence.data?.data ?? []).map((entry) => (
              <View key={entry.id} style={{ gap: 2 }}>
                <Text variant="caption" tone="muted">
                  {formatRelativeTime(entry.ts)}
                  {entry.code ? ` · ${entry.code}` : ''}
                </Text>
                <Text tone={entry.severity === 'info' ? 'primary' : 'danger'}>{entry.message}</Text>
              </View>
            ))
          )}

          {assetId ? (
            <Button
              label={t('alerts.viewLogs')}
              variant="secondary"
              onPress={() => router.push(`/logs/${assetId}`)}
              testID="alert-view-logs"
            />
          ) : null}
        </Surface>

        <Button
          label={t('common.back')}
          variant="ghost"
          testID="alert-detail-back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Text variant="label">{value}</Text>
    </View>
  );
}
