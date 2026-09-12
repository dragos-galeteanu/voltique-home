/** Proves a cold start with no connection still shows the last data, and refuses writes. */
import { api } from '@/api/api';
import { voltiqueApi } from '@/api/generated/endpoints';
import { signedIn } from '@/features/auth/auth-slice';
import { connectivityChanged } from '@/features/network/network-slice';
import { type AppStore, createStore } from '@/store/create-store';
import { type FetchMock, installFetchMock } from '@/test/fetch-mock';

import { storageRestored } from './cache-slice';
import { buildSnapshot } from './persisted-state';

const HOUSEHOLDS_PATH = '/api/v1/households';
const ALERT_PATH = '/api/v1/alerts/alert-1';

const households = {
  nextCursor: null,
  data: [
    {
      id: 'h1',
      name: 'Maple Street',
      timezone: 'Europe/Bucharest',
      membershipRole: 'owner',
      assetCount: 4,
      createdAt: '2026-02-02T10:00:00Z',
    },
  ],
};

let fetchMock: FetchMock;
let stores: AppStore[] = [];

function freshStore() {
  const store = createStore();
  stores.push(store);
  store.dispatch(
    signedIn({
      user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    }),
  );
  return store;
}

beforeEach(() => {
  fetchMock = installFetchMock();
});

afterEach(async () => {
  stores.forEach((store) => store.dispatch(api.util.resetApiState()));
  stores = [];
  fetchMock.restore();
  await new Promise((resolve) => setTimeout(resolve, 0));
});

describe('restoring a cache', () => {
  it('shows the last households without asking the network', async () => {
    // One session fetches and is snapshotted.
    fetchMock.on('GET', HOUSEHOLDS_PATH, () => ({ body: households }));
    const first = freshStore();
    const query = first.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({}));
    await query;
    const snapshot = buildSnapshot(first.getState());
    query.unsubscribe();

    // The next cold start has no network at all.
    fetchMock.restore();
    fetchMock = installFetchMock();
    const second = freshStore();
    second.dispatch(storageRestored({ cache: snapshot }));
    second.dispatch(connectivityChanged(false));

    const restored = voltiqueApi.endpoints.listHouseholds.select({})(second.getState());

    expect(restored.data?.data[0]?.name).toBe('Maple Street');
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('brings back the selected household, the appearance and where you left off', async () => {
    const snapshot = buildSnapshot(freshStore().getState());
    const store = freshStore();

    store.dispatch(
      storageRestored({
        cache: snapshot,
        appearance: { themePreference: 'dark', languagePreference: 'de' },
        selectedHouseholdId: 'h1',
        viewState: { dashboardRange: 'month', alertFilter: 'all' },
        prompts: { notificationPromptDismissed: true },
      }),
    );

    expect(store.getState().household.selectedHouseholdId).toBe('h1');
    expect(store.getState().ui.themePreference).toBe('dark');
    expect(store.getState().ui.languagePreference).toBe('de');
    expect(store.getState().viewState.dashboardRange).toBe('month');
    expect(store.getState().viewState.alertFilter).toBe('all');
    expect(store.getState().notifications.promptDismissed).toBe(true);
    expect(store.getState().cache.restoredAt).toBe(snapshot.savedAt);
  });
});

describe('writing while offline', () => {
  it('refuses the write instead of letting it hang', async () => {
    const store = freshStore();
    store.dispatch(connectivityChanged(false));

    const result = await store.dispatch(
      voltiqueApi.endpoints.updateAlertStatus.initiate({
        alertId: 'alert-1',
        alertStatusUpdate: { status: 'acknowledged' },
      }),
    );

    expect('error' in result).toBe(true);
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('lets the same write through once there is a connection', async () => {
    fetchMock.on('PATCH', ALERT_PATH, () => ({ body: { id: 'alert-1', status: 'acknowledged' } }));

    const store = freshStore();
    store.dispatch(connectivityChanged(false));
    store.dispatch(connectivityChanged(true));

    await store.dispatch(
      voltiqueApi.endpoints.updateAlertStatus.initiate({
        alertId: 'alert-1',
        alertStatusUpdate: { status: 'acknowledged' },
      }),
    );

    expect(fetchMock.count('PATCH', ALERT_PATH)).toBe(1);
  });

  it('still serves reads from the cache while offline', async () => {
    fetchMock.on('GET', HOUSEHOLDS_PATH, () => ({ body: households }));

    const store = freshStore();
    const query = store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({}));
    await query;

    store.dispatch(connectivityChanged(false));
    const cached = voltiqueApi.endpoints.listHouseholds.select({})(store.getState());

    expect(cached.data?.data[0]?.name).toBe('Maple Street');
    query.unsubscribe();
  });
});
