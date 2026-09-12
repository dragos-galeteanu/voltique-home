import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { selectRole } from '@/features/auth/auth-slice';
import { useAppSelector } from '@/store/hooks';

import { type NotificationData, routeForNotification } from './notification-routing';

/**
 * Opens what a notification refers to when it is tapped, including the one that launched
 * the app from cold. Where it goes depends on the role, which is why this waits until
 * the session is known.
 */
export function useNotificationTaps() {
  const router = useRouter();
  const role = useAppSelector(selectRole);

  useEffect(() => {
    if (!role) return;

    let cancelled = false;

    const open = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data as NotificationData | undefined;
      const href = routeForNotification(data, role);
      if (href && !cancelled) router.push(href);
    };

    // A tap that started the app is delivered once, before any listener exists.
    void Notifications.getLastNotificationResponseAsync().then(open);

    const subscription = Notifications.addNotificationResponseReceivedListener(open);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [role, router]);
}
