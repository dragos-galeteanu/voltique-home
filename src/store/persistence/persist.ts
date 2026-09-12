import {
  appearanceEntry,
  cacheEntry,
  devEntry,
  promptsEntry,
  recentlyViewedEntry,
  viewStateEntry,
} from '@/storage/registry';
import { clearScope, read, write } from '@/storage/storage';
import type { AppStore, RootState } from '@/store/create-store';

import { storageRestored } from './cache-slice';
import { buildSnapshot } from './persisted-state';

/** Writes are batched: a chatty screen must not thrash the disk. */
const WRITE_DEBOUNCE_MS = 1_000;

/** Reads every declared key and hands them to the store as one action. */
export async function restore(store: AppStore): Promise<void> {
  const [appearance, prompts, viewState, recentlyViewed, dev, cache] = await Promise.all([
    read(appearanceEntry),
    read(promptsEntry),
    read(viewStateEntry),
    read(recentlyViewedEntry),
    read(devEntry),
    read(cacheEntry),
  ]);

  store.dispatch(
    storageRestored({
      appearance,
      prompts,
      viewState: { dashboardRange: viewState.dashboardRange, alertFilter: viewState.alertFilter },
      selectedHouseholdId: viewState.selectedHouseholdId,
      recentlyViewed,
      dev,
      cache: cache ?? null,
    }),
  );
}

/** What each key should hold, given the current state. */
function projections(state: RootState) {
  return {
    appearance: {
      themePreference: state.ui.themePreference,
      languagePreference: state.ui.languagePreference,
    },
    prompts: { notificationPromptDismissed: state.notifications.promptDismissed },
    viewState: {
      dashboardRange: state.viewState.dashboardRange,
      alertFilter: state.viewState.alertFilter,
      selectedHouseholdId: state.household.selectedHouseholdId,
    },
    recentlyViewed: { enabled: state.recent.enabled, items: state.recent.items },
    dev: { mockScenario: state.dev.mockScenario },
  };
}

/**
 * Restores what was stored, then keeps it current as state changes.
 *
 * Each key is written only when its own projection changes, so switching a dashboard
 * range does not rewrite the whole cache. Returns a function that stops persisting, which
 * tests use and the app never needs.
 */
export async function hydrateAndPersist(store: AppStore): Promise<() => void> {
  await restore(store);

  let timer: ReturnType<typeof setTimeout> | null = null;
  const lastWritten = new Map<string, string>();

  async function writeIfChanged<T>(entry: Parameters<typeof write<T>>[0], value: T): Promise<void> {
    const serialised = JSON.stringify(value);
    if (lastWritten.get(entry.key) === serialised) return;

    lastWritten.set(entry.key, serialised);
    await write(entry, value);
  }

  const unsubscribe = store.subscribe(() => {
    if (timer) return;

    timer = setTimeout(() => {
      timer = null;
      const state = store.getState() as RootState;
      const next = projections(state);

      void Promise.all([
        writeIfChanged(appearanceEntry, next.appearance),
        writeIfChanged(promptsEntry, next.prompts),
        writeIfChanged(viewStateEntry, next.viewState),
        writeIfChanged(recentlyViewedEntry, next.recentlyViewed),
        writeIfChanged(devEntry, next.dev),
        write(cacheEntry, buildSnapshot(state)),
      ]);
    }, WRITE_DEBOUNCE_MS);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}

/**
 * Drops everything belonging to the person who signed out: the session, the cached data,
 * where they left off and anything they recently opened. Appearance stays, because it
 * belongs to the handset.
 */
export async function clearPersonalData(): Promise<void> {
  await clearScope('person');
}
