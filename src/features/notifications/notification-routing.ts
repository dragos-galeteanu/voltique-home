import type { Href } from 'expo-router';

import type { UserRole } from '@/features/auth/types';

/**
 * What a fault notification carries. The server sets these, so the app never parses a
 * message body to work out where to go.
 */
export type NotificationData = {
  alertId?: unknown;
  assetId?: unknown;
  householdId?: unknown;
};

function asId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Where tapping a notification should land.
 *
 * A consumer goes to the alert itself, where they can acknowledge it. An installer has
 * no alert screen of their own, so they land on the device log, which is the thing they
 * actually need. Anything unrecognised opens nothing rather than guessing.
 */
export function routeForNotification(
  data: NotificationData | null | undefined,
  role: UserRole | null,
): Href | null {
  if (!data || !role) return null;

  const alertId = asId(data.alertId);
  const assetId = asId(data.assetId);

  if (role === 'consumer') {
    if (alertId) return `/consumer/alert/${alertId}`;
    if (assetId) return `/consumer/asset/${assetId}`;
    return null;
  }

  if (assetId) return `/logs/${assetId}`;
  const householdId = asId(data.householdId);
  if (householdId) return `/installer/household/${householdId}`;
  return null;
}
