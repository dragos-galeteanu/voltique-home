import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import type { StorageBackend } from './entry';

/**
 * The two places anything is written. Nothing else in the app talks to these directly,
 * which is what keeps the list of what is stored to one file.
 */
export type Backend = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const asyncBackend: Backend = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};

const secureBackend: Backend = {
  get: (key) => SecureStore.getItemAsync(key, SECURE_OPTIONS),
  set: (key, value) => SecureStore.setItemAsync(key, value, SECURE_OPTIONS),
  remove: (key) => SecureStore.deleteItemAsync(key, SECURE_OPTIONS),
};

export function backendFor(backend: StorageBackend): Backend {
  return backend === 'secure' ? secureBackend : asyncBackend;
}
