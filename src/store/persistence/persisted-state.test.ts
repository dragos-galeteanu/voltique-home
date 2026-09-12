import type { RootState } from '@/store/create-store';

import { buildSnapshot, sanitiseApiState, snapshotAge } from './persisted-state';

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
    api: apiState,
    auth: { status: 'signedIn', user: { id: 'u1' }, tokens: { accessToken: 'secret' } },
  } as unknown as RootState;

  it('stamps when it was taken', () => {
    expect(buildSnapshot(state, new Date('2026-09-12T08:00:00Z')).savedAt).toBe(
      '2026-09-12T08:00:00.000Z',
    );
  });

  it('holds data only, never the session or any preference', () => {
    const snapshot = buildSnapshot(state) as unknown as Record<string, unknown>;

    expect(Object.keys(snapshot).sort()).toEqual(['api', 'savedAt']);
    expect(JSON.stringify(snapshot)).not.toContain('secret');
  });
});

describe('snapshotAge', () => {
  const snapshot = buildSnapshot(
    { api: {} } as unknown as RootState,
    new Date('2026-09-12T08:00:00Z'),
  );

  it('says how old the restored data is', () => {
    expect(snapshotAge(snapshot, Date.parse('2026-09-12T09:00:00Z'))).toBe(3_600_000);
  });

  it('never reports a negative age from a clock that moved', () => {
    expect(snapshotAge(snapshot, Date.parse('2026-09-12T07:00:00Z'))).toBe(0);
  });

  it('is null when nothing was restored', () => {
    expect(snapshotAge(null)).toBeNull();
  });
});
