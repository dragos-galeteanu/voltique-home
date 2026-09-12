import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppStore, RootState } from '@/store/create-store';

import { cacheRehydrated, hydrationFinished } from './cache-slice';
import { buildSnapshot, type PersistedState, readSnapshot } from './persisted-state';

const STORAGE_KEY = 'voltique.cache.v1';

/** Writes are batched: a chatty screen must not thrash the disk. */
const WRITE_DEBOUNCE_MS = 1_000;

export async function loadSnapshot(): Promise<PersistedState | null> {
  try {
    return readSnapshot(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    // A corrupt or unreadable file is not worth failing startup over.
    return null;
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the next write replaces it anyway.
  }
}

/**
 * Restores the last snapshot into a store, then keeps writing new ones as state changes.
 *
 * Returns a function that stops persisting, which tests use and the app never needs.
 */
export async function hydrateAndPersist(store: AppStore): Promise<() => void> {
  const snapshot = await loadSnapshot();

  // One action: every interested slice, including RTK Query, reads what it needs from it.
  store.dispatch(snapshot ? cacheRehydrated(snapshot) : hydrationFinished());

  let timer: ReturnType<typeof setTimeout> | null = null;

  const unsubscribe = store.subscribe(() => {
    if (timer) return;

    timer = setTimeout(() => {
      timer = null;
      const state = store.getState() as RootState;

      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(buildSnapshot(state))).catch(() => {
        // Losing a snapshot costs the next cold start its cache, nothing more.
      });
    }, WRITE_DEBOUNCE_MS);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
