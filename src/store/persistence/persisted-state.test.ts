import type { RootState } from '@/store/create-store';

import {
  buildSnapshot,
  PERSISTED_VERSION,
  readSnapshot,
  sanitiseApiState,
  snapshotAge,
} from './persisted-state';

const apiState = {
  queries: {
    'listHouseholds({})': {
      status: 'fulfilled',
      data: { data: [] },
      endpointName: 'listHouseholds',
    },
    'getAlert({"alertId":"a"})': { status: 'pending', endpointName: 'getAlert' },
    'listAlerts({})': { status: 'rejected', error: {}, endpointName: 'listAlerts' },
    'getAsset({"assetId":"x"})': { status: 'fulfilled', endpointName: 'getAsset' },
  },
  mutations: { 'signIn(abc)': { status: 'fulfilled' } },
  provided: { tags: { Household: {} }, keys: {} },
  subscriptions: { 'listHouseholds({})': {} },
  config: { online: true },
};

describe('sanitiseApiState', () => {
  it('keeps only queries that completed with data', () => {
    const kept = sanitiseApiState(apiState) as { queries: Record<string, unknown> };

    expect(Object.keys(kept.queries)).toEqual(['listHouseholds({})']);
  });

  it('drops mutations, so a write can never be replayed from disk', () => {
    const kept = sanitiseApiState(apiState) as { mutations: Record<string, unknown> };

    expect(kept.mutations).toEqual({});
  });

  it('drops subscriptions, which belong to the running session', () => {
    const kept = sanitiseApiState(apiState) as Record<string, unknown>;

    expect(kept.subscriptions).toBeUndefined();
  });

  it('keeps the tag index, which invalidation needs after the next write', () => {
    const kept = sanitiseApiState(apiState) as { provided: unknown };

    expect(kept.provided).toEqual({ tags: { Household: {} }, keys: {} });
  });

  it('survives nonsense where a cache file should be', () => {
    const empty = { queries: {}, mutations: {}, provided: { tags: {}, keys: {} } };

    expect(sanitiseApiState(null)).toEqual(empty);
    expect(sanitiseApiState('not an object')).toEqual(empty);
  });
});

describe('buildSnapshot', () => {
  const state = {
    ui: { themePreference: 'dark', languagePreference: 'de' },
    household: { selectedHouseholdId: 'h1' },
    api: apiState,
    auth: { status: 'signedIn', user: { id: 'u1' }, tokens: { accessToken: 'secret' } },
  } as unknown as RootState;

  it('stamps when it was taken', () => {
    const snapshot = buildSnapshot(state, new Date('2026-09-12T08:00:00Z'));

    expect(snapshot.savedAt).toBe('2026-09-12T08:00:00.000Z');
    expect(snapshot.version).toBe(PERSISTED_VERSION);
  });

  it('never writes the session to disk, which belongs in the keychain', () => {
    const snapshot = buildSnapshot(state) as unknown as Record<string, unknown>;

    expect(snapshot.auth).toBeUndefined();
    expect(JSON.stringify(snapshot)).not.toContain('secret');
  });

  it('keeps the appearance and the selected household', () => {
    const snapshot = buildSnapshot(state);

    expect(snapshot.ui.themePreference).toBe('dark');
    expect(snapshot.household.selectedHouseholdId).toBe('h1');
  });
});

describe('readSnapshot', () => {
  const valid = JSON.stringify(
    buildSnapshot(
      { ui: {}, household: {}, api: apiState } as unknown as RootState,
      new Date('2026-09-12T08:00:00Z'),
    ),
  );

  it('reads back what it wrote', () => {
    expect(readSnapshot(valid)?.savedAt).toBe('2026-09-12T08:00:00.000Z');
  });

  it('refuses a snapshot from an older shape rather than guessing', () => {
    const older = JSON.stringify({ ...JSON.parse(valid), version: PERSISTED_VERSION - 1 });

    expect(readSnapshot(older)).toBeNull();
  });

  it('refuses damaged or missing files', () => {
    expect(readSnapshot('{ not json')).toBeNull();
    expect(readSnapshot(null)).toBeNull();
    expect(readSnapshot('{}')).toBeNull();
  });
});

describe('snapshotAge', () => {
  it('says how old the restored data is', () => {
    const snapshot = buildSnapshot(
      { ui: {}, household: {}, api: {} } as unknown as RootState,
      new Date('2026-09-12T08:00:00Z'),
    );

    expect(snapshotAge(snapshot, Date.parse('2026-09-12T09:00:00Z'))).toBe(3_600_000);
  });

  it('never reports a negative age from a clock that moved', () => {
    const snapshot = buildSnapshot(
      { ui: {}, household: {}, api: {} } as unknown as RootState,
      new Date('2026-09-12T08:00:00Z'),
    );

    expect(snapshotAge(snapshot, Date.parse('2026-09-12T07:00:00Z'))).toBe(0);
  });

  it('is null when nothing was restored', () => {
    expect(snapshotAge(null)).toBeNull();
  });
});
