import * as SecureStore from 'expo-secure-store';

import type { AuthSession } from './types';

/**
 * Session persistence. Tokens go to the Keychain on iOS and to EncryptedSharedPreferences
 * on Android, never to AsyncStorage, so a rooted-device backup does not leak them.
 */
const SESSION_KEY = 'voltique.session';

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function readStoredSession(): Promise<AuthSession | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (error) {
    // A corrupt or undecryptable entry must not brick startup: drop it and sign out.
    console.warn('Failed to read stored session', error);
    await clearStoredSession();
    return null;
  }
}

export async function writeStoredSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), OPTIONS);
}

export async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
}
