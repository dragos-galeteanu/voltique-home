/** Exercises the optimistic acknowledge and resolve against a stubbed network. */
import { api } from '@/api/api';
import { voltiqueApi } from '@/api/generated/endpoints';
import { signedIn } from '@/features/auth/auth-slice';
import { type AppStore, createStore } from '@/store/create-store';
import { type FetchMock, installFetchMock } from '@/test/fetch-mock';

import { alertApi } from './alert-endpoints';

const HOUSEHOLD = '11111111-1111-4111-8111-111111111111';
const ALERT = '33333333-3333-4333-8333-333333333333';
const ALERTS_PATH = `/api/v1/households/${HOUSEHOLD}/alerts`;
const ALERT_PATH = `/api/v1/alerts/${ALERT}`;

const openAlert = {
  id: ALERT,
  householdId: HOUSEHOLD,
  assetId: '22222222-2222-4222-8222-222222222222',
  code: 'inverter_grid_voltage',
  severity: 'critical',
  status: 'open',
  title: 'Inverter stopped exporting',
  derivedFrom: 'deviceLog',
  firstSeenAt: '2026-09-12T07:41:12Z',
  lastSeenAt: '2026-09-12T08:55:00Z',
  occurrences: 47,
};

let fetchMock: FetchMock;
let stores: AppStore[] = [];

function signedInStore() {
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

function listedStatus(store: AppStore) {
  const result = voltiqueApi.endpoints.listHouseholdAlerts.select({ householdId: HOUSEHOLD })(
    store.getState(),
  );
  return result.data?.data[0]?.status;
}

describe('acknowledging an alert', () => {
  it('updates the inbox before the server answers, and keeps it when it does', async () => {
    fetchMock.on('GET', ALERTS_PATH, () => ({ body: { data: [openAlert], nextCursor: null } }));
    fetchMock.on('PATCH', ALERT_PATH, () => ({ body: { ...openAlert, status: 'acknowledged' } }));

    const store = signedInStore();
    const list = store.dispatch(
      voltiqueApi.endpoints.listHouseholdAlerts.initiate({ householdId: HOUSEHOLD }),
    );
    await list;

    await store.dispatch(
      alertApi.endpoints.updateAlertStatus.initiate({
        alertId: ALERT,
        alertStatusUpdate: { status: 'acknowledged' },
      }),
    );

    expect(listedStatus(store)).toBe('acknowledged');
    expect(fetchMock.requests.at(-1)?.body).toEqual({ status: 'acknowledged' });
    list.unsubscribe();
  });

  it('puts the row back when the server refuses', async () => {
    fetchMock.on('GET', ALERTS_PATH, () => ({ body: { data: [openAlert], nextCursor: null } }));
    fetchMock.on('PATCH', ALERT_PATH, () => ({
      status: 403,
      body: { title: 'Not permitted', status: 403, code: 'household_access_denied' },
    }));

    const store = signedInStore();
    const list = store.dispatch(
      voltiqueApi.endpoints.listHouseholdAlerts.initiate({ householdId: HOUSEHOLD }),
    );
    await list;

    const result = await store.dispatch(
      alertApi.endpoints.updateAlertStatus.initiate({
        alertId: ALERT,
        alertStatusUpdate: { status: 'resolved' },
      }),
    );

    expect('error' in result).toBe(true);
    expect(listedStatus(store)).toBe('open');
    list.unsubscribe();
  });
});
