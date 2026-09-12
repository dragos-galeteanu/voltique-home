import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { DevicePlatform } from '@/api/generated/endpoints';

import type { PushPermission } from './notification-slice';

/**
 * The native side of push: permission, the Expo token, and the Android channel.
 *
 * Kept apart from the React and Redux code so the parts worth testing, deciding when to
 * ask and where a tap should land, do not need a device to exercise.
 */

/** Android groups notifications by channel; without one, nothing is shown. */
export const FAULT_CHANNEL_ID = 'faults';

export async function ensureAndroidChannel(channelName: string): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(FAULT_CHANNEL_ID, {
    name: channelName,
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

function toPermission(status: Notifications.PermissionStatus): PushPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function getPushPermission(): Promise<PushPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  return toPermission(status);
}

export async function requestPushPermission(): Promise<PushPermission> {
  const { status } = await Notifications.requestPermissionsAsync();
  return toPermission(status);
}

/**
 * The token to register with the API. Null on a simulator, which cannot receive push at
 * all, so the caller can skip registration instead of reporting a failure.
 */
export async function getExpoPushToken(projectId: string | undefined): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return data;
}

export function currentPlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/** What the person will recognise in a list of their devices. */
export function deviceLabel(): string {
  return [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || currentPlatform();
}
