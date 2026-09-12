/** Exercises the API client end to end against a stubbed network. */
import { api } from '@/api/api';
import { voltiqueApi } from '@/api/generated/endpoints';
import { selectAccessToken, selectAuthStatus, signedIn } from '@/features/auth/auth-slice';
import { type AppStore, createStore } from '@/store/create-store';
import { type FetchMock, installFetchMock } from '@/test/fetch-mock';

const ME = '/api/v1/users/me';
const REFRESH = '/api/v1/auth/sessions/refresh';
const HOUSEHOLDS = '/api/v1/households';

const user = {
  id: 'u1',
  email: 'ada@example.com',
  displayName: 'Ada',
  role: 'consumer',
  createdAt: '2026-01-14T09:12:00Z',
};

const unauthorized = { status: 401, body: { title: 'Not authenticated', status: 401 } };
const freshTokens = {
  accessToken: 'fresh-access',
  refreshToken: 'fresh-refresh',
  expiresIn: 900,
};

let fetchMock: FetchMock;
let stores: AppStore[] = [];

beforeEach(() => {
  fetchMock = installFetchMock();
});

afterEach(async () => {
  // Drops the cache entries RTK Query would otherwise hold, then lets the frame
  // callbacks React Native's Jest preset schedules run before the environment is torn
  // down. Without this they fire afterwards and report as leaks.
  stores.forEach((store) => store.dispatch(api.util.resetApiState()));
  stores = [];
  fetchMock.restore();
  await new Promise((resolve) => setTimeout(resolve, 0));
});

/**
 * Dispatches a query and drops its subscription, so the cache entry does not sit around
 * waiting on a removal timer after the test ends.
 */
async function run<T extends { unsubscribe?: () => void }>(promise: T) {
  const result = await promise;
  promise.unsubscribe?.();
  return result;
}

function signedInStore() {
  const store = createStore();
  stores.push(store);
  store.dispatch(
    signedIn({
      user: { id: 'u1', email: user.email, displayName: 'Ada', role: 'consumer' },
      tokens: { accessToken: 'expired-access', refreshToken: 'good-refresh' },
    }),
  );
  return store;
}

describe('API client', () => {
  it('sends the access token with every request', async () => {
    fetchMock.on('GET', ME, () => ({ body: user }));

    const store = signedInStore();
    await run(store.dispatch(voltiqueApi.endpoints.getCurrentUser.initiate()));

    expect(fetchMock.requests[0]?.headers.authorization).toBe('Bearer expired-access');
  });

  it('refreshes on a 401 and replays the original request', async () => {
    fetchMock.on('GET', ME, (request) =>
      request.headers.authorization === 'Bearer fresh-access' ? { body: user } : unauthorized,
    );
    fetchMock.on('POST', REFRESH, () => ({ body: freshTokens }));

    const store = signedInStore();
    const result = await run(store.dispatch(voltiqueApi.endpoints.getCurrentUser.initiate()));

    expect(result.data).toMatchObject({ id: 'u1' });
    expect(fetchMock.count('GET', ME)).toBe(2);
    expect(selectAccessToken(store.getState())).toBe('fresh-access');
    expect(selectAuthStatus(store.getState())).toBe('signedIn');
  });

  it('sends the stored refresh token, not the expired access token', async () => {
    fetchMock.on('GET', ME, () => unauthorized);
    fetchMock.on('POST', REFRESH, () => ({ body: freshTokens }));

    const store = signedInStore();
    await run(store.dispatch(voltiqueApi.endpoints.getCurrentUser.initiate()));

    const refresh = fetchMock.requests.find((request) => request.path === REFRESH);
    expect(refresh?.body).toEqual({ refreshToken: 'good-refresh' });
  });

  it('signs the user out when the refresh token is rejected', async () => {
    fetchMock.on('GET', ME, () => unauthorized);
    fetchMock.on('POST', REFRESH, () => unauthorized);

    const store = signedInStore();
    const result = await run(store.dispatch(voltiqueApi.endpoints.getCurrentUser.initiate()));

    expect(result.error).toBeDefined();
    expect(selectAuthStatus(store.getState())).toBe('signedOut');
    expect(selectAccessToken(store.getState())).toBeNull();
  });

  it('refreshes once when several requests fail at the same time', async () => {
    const authorized = (request: { headers: Record<string, string> }) =>
      request.headers.authorization === 'Bearer fresh-access';

    fetchMock.on('GET', ME, (request) => (authorized(request) ? { body: user } : unauthorized));
    fetchMock.on('GET', HOUSEHOLDS, (request) =>
      authorized(request) ? { body: { data: [], nextCursor: null } } : unauthorized,
    );
    fetchMock.on('POST', REFRESH, async () => {
      // A slow refresh is exactly when a second request would start its own.
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { body: freshTokens };
    });

    const store = signedInStore();
    const [me, households] = await Promise.all([
      run(store.dispatch(voltiqueApi.endpoints.getCurrentUser.initiate())),
      run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({}))),
    ]);

    expect(me.data).toMatchObject({ id: 'u1' });
    expect(households.data).toMatchObject({ data: [] });
    expect(fetchMock.count('POST', REFRESH)).toBe(1);
  });

  it('does not try to refresh when the refresh call itself is the one failing', async () => {
    fetchMock.on('POST', REFRESH, () => unauthorized);

    const store = signedInStore();
    // A mutation holds no cache subscription, so there is nothing to unsubscribe from.
    await store.dispatch(
      voltiqueApi.endpoints.refreshSession.initiate({ refreshRequest: { refreshToken: 'dead' } }),
    );

    expect(fetchMock.count('POST', REFRESH)).toBe(1);
    expect(selectAuthStatus(store.getState())).toBe('signedOut');
  });
});
