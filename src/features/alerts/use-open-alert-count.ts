import { skipToken } from '@reduxjs/toolkit/query';

import { useListHouseholdAlertsQuery } from '@/api/generated/endpoints';
import { useSelectedHousehold } from '@/features/household/use-selected-household';

/** Small enough that a badge never needs a second page. */
const BADGE_LIMIT = 99;
const POLL_MS = 30_000;

/**
 * How many open faults the household has, for the tab badge. The payload is tiny, which
 * is why this is the one query that polls whatever screen you are on.
 */
export function useOpenAlertCount(): number {
  const { household } = useSelectedHousehold();

  const alerts = useListHouseholdAlertsQuery(
    household ? { householdId: household.id, status: 'open', limit: BADGE_LIMIT } : skipToken,
    { pollingInterval: POLL_MS },
  );

  return alerts.data?.data.length ?? 0;
}
