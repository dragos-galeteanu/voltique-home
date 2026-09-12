import type { RootState } from '@/store/create-store';

/**
 * The offline read cache: the last thing the API returned, and when.
 *
 * Preferences no longer live here. They are separate keys with their own scopes, so
 * signing out can drop the data without resetting how the app looks.
 */
export const CACHE_VERSION = 2;

export type CacheSnapshot = {
  /** When the snapshot was taken, so the app can say how old what you see is. */
  savedAt: string;
  api: unknown;
};

type QueryEntry = {
  status?: string;
  data?: unknown;
};

/** The shape RTK Query's invalidation reducer expects to merge into. */
const EMPTY_TAG_INDEX = { tags: {}, keys: {} };

/**
 * Keeps only queries that actually completed.
 *
 * A pending or failed entry restored from disk would leave the app showing a spinner for
 * a request nobody made, and subscriptions belong to the running session, not to a file.
 * Mutations are dropped outright, so no write can ever come back from disk.
 *
 * The tag index is kept, because invalidation after the next successful write needs to
 * know which restored entries a tag covers.
 */
export function sanitiseApiState(apiState: unknown): unknown {
  const empty = { queries: {}, mutations: {}, provided: EMPTY_TAG_INDEX };
  if (!apiState || typeof apiState !== 'object') return empty;

  const state = apiState as {
    queries?: Record<string, QueryEntry | undefined>;
    provided?: unknown;
  };

  const fulfilled = Object.fromEntries(
    Object.entries(state.queries ?? {}).filter(
      ([, entry]) => entry?.status === 'fulfilled' && entry.data !== undefined,
    ),
  );

  return {
    queries: fulfilled,
    mutations: {},
    provided: state.provided ?? EMPTY_TAG_INDEX,
  };
}

export function buildSnapshot(state: RootState, now: Date = new Date()): CacheSnapshot {
  return {
    savedAt: now.toISOString(),
    api: sanitiseApiState(state.api),
  };
}

/** How old the restored data is, in milliseconds, or null if nothing was restored. */
export function snapshotAge(snapshot: CacheSnapshot | null, now = Date.now()): number | null {
  if (!snapshot) return null;

  const savedAt = Date.parse(snapshot.savedAt);
  return Number.isNaN(savedAt) ? null : Math.max(0, now - savedAt);
}
