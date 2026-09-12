import type { Alert, AlertSeverity, AlertSource, AlertStatus } from '@/api/generated/endpoints';
import type { StatusTone } from '@/design-system';

/**
 * How an alert reads and looks. Labels are translation keys so the mapping itself stays
 * language independent, the same way asset status works.
 */
export const ALERT_SEVERITY_PRESENTATION: Record<
  AlertSeverity,
  { labelKey: `alerts.severity.${AlertSeverity}`; tone: StatusTone }
> = {
  critical: { labelKey: 'alerts.severity.critical', tone: 'danger' },
  warning: { labelKey: 'alerts.severity.warning', tone: 'warning' },
};

export const ALERT_STATUS_PRESENTATION: Record<
  AlertStatus,
  { labelKey: `alerts.status.${AlertStatus}`; tone: StatusTone }
> = {
  open: { labelKey: 'alerts.status.open', tone: 'danger' },
  acknowledged: { labelKey: 'alerts.status.acknowledged', tone: 'info' },
  resolved: { labelKey: 'alerts.status.resolved', tone: 'success' },
};

export const ALERT_SOURCE_LABEL: Record<AlertSource, `alerts.source.${AlertSource}`> = {
  deviceLog: 'alerts.source.deviceLog',
  telemetryThreshold: 'alerts.source.telemetryThreshold',
  connectivity: 'alerts.source.connectivity',
};

/**
 * What the user can do next. A resolved alert offers nothing: the server reopens it by
 * itself if the condition returns, so there is no client-side undo to offer.
 */
export function nextActionsFor(status: AlertStatus): ('acknowledge' | 'resolve')[] {
  if (status === 'open') return ['acknowledge', 'resolve'];
  if (status === 'acknowledged') return ['resolve'];
  return [];
}

/** Open alerts first, then most recently seen, so the inbox needs no sorting controls. */
export function sortForInbox(alerts: readonly Alert[]): Alert[] {
  const rank: Record<AlertStatus, number> = { open: 0, acknowledged: 1, resolved: 2 };

  return [...alerts].sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return Date.parse(b.lastSeenAt) - Date.parse(a.lastSeenAt);
  });
}
