/** The fixture backend answers the same URLs the real client calls. */
import { api } from '@/api/api';
import { voltiqueApi } from '@/api/generated/endpoints';
import { signedIn } from '@/features/auth/auth-slice';
import { mockScenarioSelected } from '@/features/dev/dev-slice';
import { startScenario } from '@/mocks/fixture-base-query';
import { type AppStore, createStore } from '@/store/create-store';
import { type FetchMock, installFetchMock } from '@/test/fetch-mock';

import type { ScenarioId } from './scenarios';

let fetchMock: FetchMock;
let stores: AppStore[] = [];

function mockedStore(scenario: ScenarioId = 'populated') {
  const store = createStore();
  stores.push(store);

  startScenario(scenario);
  store.dispatch(mockScenarioSelected(scenario));
  store.dispatch(
    signedIn({
      user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
      tokens: { accessToken: 'mock', refreshToken: 'mock' },
    }),
  );
  return store;
}

async function run<T extends { unsubscribe?: () => void }>(promise: T) {
  const result = await promise;
  promise.unsubscribe?.();
  return result;
}

beforeEach(() => {
  // Any request that escaped to the network would fail loudly here.
  fetchMock = installFetchMock();
});

afterEach(async () => {
  stores.forEach((store) => store.dispatch(api.util.resetApiState()));
  stores = [];
  fetchMock.restore();
  await new Promise((resolve) => setTimeout(resolve, 0));
});

describe('reading', () => {
  it('answers from the contract examples without touching the network', async () => {
    const store = mockedStore();

    const result = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));

    expect(result.data?.data[0]?.name).toBe('Maple Street');
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('resolves path parameters, so a detail screen gets its own record', async () => {
    const store = mockedStore();
    const households = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));
    const householdId = households.data!.data[0]!.id;

    const result = await run(
      store.dispatch(voltiqueApi.endpoints.getHousehold.initiate({ householdId })),
    );

    expect(result.data?.id).toBe(householdId);
  });

  it('applies query filters the way the real API would', async () => {
    const store = mockedStore();

    const open = await run(
      store.dispatch(voltiqueApi.endpoints.listAlerts.initiate({ status: 'open' })),
    );
    const resolved = await run(
      store.dispatch(voltiqueApi.endpoints.listAlerts.initiate({ status: 'resolved' })),
    );

    expect(open.data?.data.every((alert) => alert.status === 'open')).toBe(true);
    expect(resolved.data?.data.every((alert) => alert.status === 'resolved')).toBe(true);
  });
});

describe('writing', () => {
  it('remembers a change, so a refetch does not undo it', async () => {
    const store = mockedStore();
    const before = await run(
      store.dispatch(voltiqueApi.endpoints.listAlerts.initiate({ status: 'open' })),
    );
    const alertId = before.data!.data[0]!.id;

    await store.dispatch(
      voltiqueApi.endpoints.updateAlertStatus.initiate({
        alertId,
        alertStatusUpdate: { status: 'acknowledged' },
      }),
    );

    const after = await run(store.dispatch(voltiqueApi.endpoints.getAlert.initiate({ alertId })));

    expect(after.data?.status).toBe('acknowledged');
  });

  it('adds what was created, and removes what was deleted', async () => {
    const store = mockedStore();
    const households = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));
    const householdId = households.data!.data[0]!.id;

    const created = await store.dispatch(
      voltiqueApi.endpoints.createHouseholdAsset.initiate({
        householdId,
        assetCreate: {
          name: 'Garden array',
          assetTypeId: 'solar_inverter',
          manufacturerId: 'sunra',
          modelId: 'sunra-x7',
          credentials: { serialNumber: 'ABCD1234' },
        },
      }),
    );
    const assetId = 'data' in created ? (created.data?.id ?? '') : '';

    const listed = await run(
      store.dispatch(voltiqueApi.endpoints.listHouseholdAssets.initiate({ householdId })),
    );
    expect(listed.data?.data.some((asset) => asset.id === assetId)).toBe(true);
    // A newly added asset has not reported yet, exactly as the real API describes it.
    expect(listed.data?.data.find((asset) => asset.id === assetId)?.status).toBe('commissioning');

    await store.dispatch(voltiqueApi.endpoints.deleteAsset.initiate({ assetId }));

    const after = await run(
      store.dispatch(voltiqueApi.endpoints.listHouseholdAssets.initiate({ householdId })),
    );
    expect(after.data?.data.some((asset) => asset.id === assetId)).toBe(false);
  });
});

describe('scenarios', () => {
  it('empties everything for the new-account case', async () => {
    const store = mockedStore('empty');

    const result = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));

    expect(result.data?.data).toEqual([]);
  });

  it('fails every request when the API is down', async () => {
    const store = mockedStore('failing');

    const result = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));

    expect(result.error).toMatchObject({ status: 503 });
  });

  it('signs in as an installer for the installer scenario', async () => {
    const store = mockedStore('installer');

    const result = await run(store.dispatch(voltiqueApi.endpoints.getCurrentUser.initiate()));

    expect(result.data?.role).toBe('installer');
  });

  it('opens every asset as faulted when everything is broken', async () => {
    const store = mockedStore('faulted');
    const households = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));

    const assets = await run(
      store.dispatch(
        voltiqueApi.endpoints.listHouseholdAssets.initiate({
          householdId: households.data!.data[0]!.id,
        }),
      ),
    );

    expect(assets.data?.data.every((asset) => asset.status === 'faulted')).toBe(true);
  });
});
