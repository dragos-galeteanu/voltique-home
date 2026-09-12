import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useRegisterDeviceMutation, useUnregisterDeviceMutation } from '@/api/generated/endpoints';
import { env } from '@/config/env';
import { selectAuthStatus } from '@/features/auth/auth-slice';
import { currentLocale } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  deviceRegistered,
  permissionChecked,
  registrationFailed,
  selectDeviceId,
  selectPushPermission,
} from './notification-slice';
import {
  currentPlatform,
  deviceLabel,
  ensureAndroidChannel,
  getExpoPushToken,
  getPushPermission,
  requestPushPermission,
} from './push-token';

/**
 * Registers this handset for fault notifications once, after sign-in and only once
 * permission exists. Nothing here asks for permission by itself: the app asks at a
 * moment the person can understand, which is the alerts screen.
 */
export function usePushRegistration() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const status = useAppSelector(selectAuthStatus);
  const permission = useAppSelector(selectPushPermission);
  const deviceId = useAppSelector(selectDeviceId);

  const [registerDevice] = useRegisterDeviceMutation();

  useEffect(() => {
    if (status !== 'signedIn') return;

    void getPushPermission().then((current) => dispatch(permissionChecked(current)));
  }, [dispatch, status]);

  useEffect(() => {
    if (status !== 'signedIn' || permission !== 'granted' || deviceId) return;

    let cancelled = false;

    void (async () => {
      try {
        await ensureAndroidChannel(t('notifications.channelName'));
        const token = await getExpoPushToken(env.easProjectId);

        // A simulator has no token. Not an error, just nothing to register.
        if (!token || cancelled) return;

        const device = await registerDevice({
          deviceRegistration: {
            pushToken: token,
            platform: currentPlatform(),
            label: deviceLabel(),
            appVersion: env.appVersion,
            locale: currentLocale(),
            notifications: { enabled: true, minSeverity: 'warning' },
          },
        }).unwrap();

        if (!cancelled) dispatch(deviceRegistered(device.id));
      } catch (error) {
        if (!cancelled) {
          dispatch(registrationFailed(error instanceof Error ? error.message : 'unknown'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deviceId, dispatch, permission, registerDevice, status, t]);
}

/**
 * Asks for permission in response to a deliberate tap. Returns what the person chose so
 * the caller can stop asking.
 */
export function useRequestPushPermission() {
  const dispatch = useAppDispatch();

  return useCallback(async () => {
    const result = await requestPushPermission();
    dispatch(permissionChecked(result));
    return result;
  }, [dispatch]);
}

/**
 * Detaches this handset before the session ends, so a shared phone stops receiving
 * someone else's faults. Called before signing out, while the token still works.
 */
export function useUnregisterDevice() {
  const deviceId = useAppSelector(selectDeviceId);
  const [unregisterDevice] = useUnregisterDeviceMutation();

  return useCallback(async () => {
    if (!deviceId) return;

    try {
      await unregisterDevice({ deviceId }).unwrap();
    } catch {
      // Signing out must not be blocked by a failed cleanup; the server expires stale
      // tokens on its own when a push is rejected.
    }
  }, [deviceId, unregisterDevice]);
}
