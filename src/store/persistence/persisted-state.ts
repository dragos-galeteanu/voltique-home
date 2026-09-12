import type { RootState } from '@/store/create-store';

/**
 * What survives a cold start, and in what shape.
 *
 * Only read-only material is kept: the last data the API returned, which household was
 * selected, and how the person likes the app to look. Nothing here can be written back to
 * the server, so a stale cache can never turn into a wrong write.
 */
export const PERSISTED_VERSION = 1;

export type PersistedState = {
  version: number;
  /** When the snapshot was taken, so the app can say how old what you see is. */
  savedAt: string;
  ui: RootState['ui'];
  household: RootState['household'];
  api: unknown;
};

type QueryEntry = {
  status?: string;
  data?: unknown;
  originalArgs?: unknown;
  endpointName?: string;
  fulfilledTimeStamp?: number;
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

export function buildSnapshot(state: RootState, now: Date = new Date()): PersistedState {
  return {
    version: PERSISTED_VERSION,
    savedAt: now.toISOString(),
    ui: state.ui,
    household: state.household,
    api: sanitiseApiState(state.api),
  };
}

/** Rejects anything written by an older shape, rather than guessing how to migrate it. */
export function readSnapshot(raw: string | null): PersistedState | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.version !== PERSISTED_VERSION) return null;
    if (typeof parsed.savedAt !== 'string') return null;

    return parsed as PersistedState;
  } catch {
    return null;
  }
}

/** How old the restored data is, in milliseconds, or null if nothing was restored. */
export function snapshotAge(snapshot: PersistedState | null, now = Date.now()): number | null {
  if (!snapshot) return null;

  const savedAt = Date.parse(snapshot.savedAt);
  return Number.isNaN(savedAt) ? null : Math.max(0, now - savedAt);
}
