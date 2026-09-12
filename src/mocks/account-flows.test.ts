/** The new account flows, against the in-process backend. */
import { api } from '@/api/api';
import { voltiqueApi } from '@/api/generated/endpoints';
import { mockScenarioSelected } from '@/features/dev/dev-slice';
import { startScenario } from '@/mocks/fixture-base-query';
import { type AppStore, createStore } from '@/store/create-store';
import { type FetchMock, installFetchMock } from '@/test/fetch-mock';

let fetchMock: FetchMock;
let stores: AppStore[] = [];

function mockedStore() {
  const store = createStore();
  stores.push(store);
  startScenario('populated');
  store.dispatch(mockScenarioSelected('populated'));
  return store;
}

async function run<T extends { unsubscribe?: () => void }>(promise: T) {
  const result = await promise;
  promise.unsubscribe?.();
  return result;
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

describe('signing up', () => {
  it('creates an account that starts with nothing in it', async () => {
    const store = mockedStore();

    const result = await store.dispatch(
      voltiqueApi.endpoints.signUp.initiate({
        registrationRequest: {
          displayName: 'Sam',
          email: 'sam@example.com',
          password: 'password1',
        },
      }),
    );

    expect('data' in result && result.data?.user.email).toBe('sam@example.com');

    const households = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));
    expect(households.data?.data).toEqual([]);
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('refuses an address that already has an account', async () => {
    const store = mockedStore();

    const result = await store.dispatch(
      voltiqueApi.endpoints.signUp.initiate({
        registrationRequest: {
          displayName: 'Ada',
          email: 'ada@example.com',
          password: 'password1',
        },
      }),
    );

    expect('error' in result && result.error).toMatchObject({ status: 409 });
  });
});

describe('resetting a password', () => {
  it('answers the same way whatever address is given', async () => {
    const store = mockedStore();

    const known = await store.dispatch(
      voltiqueApi.endpoints.requestPasswordReset.initiate({
        passwordResetRequest: { email: 'ada@example.com' },
      }),
    );
    const unknown = await store.dispatch(
      voltiqueApi.endpoints.requestPasswordReset.initiate({
        passwordResetRequest: { email: 'nobody@example.com' },
      }),
    );

    expect('error' in known).toBe(false);
    expect('error' in unknown).toBe(false);
  });

  it('rejects a link it never issued', async () => {
    const store = mockedStore();

    const result = await store.dispatch(
      voltiqueApi.endpoints.confirmPasswordReset.initiate({
        token: 'made-up',
        passwordResetConfirmation: { password: 'newpassword' },
      }),
    );

    expect('error' in result && result.error).toMatchObject({ status: 404 });
  });

  it('accepts a link it did issue, once', async () => {
    const store = mockedStore();
    await store.dispatch(
      voltiqueApi.endpoints.requestPasswordReset.initiate({
        passwordResetRequest: { email: 'ada@example.com' },
      }),
    );

    const first = await store.dispatch(
      voltiqueApi.endpoints.confirmPasswordReset.initiate({
        token: 'reset-token',
        passwordResetConfirmation: { password: 'newpassword' },
      }),
    );
    const second = await store.dispatch(
      voltiqueApi.endpoints.confirmPasswordReset.initiate({
        token: 'reset-token',
        passwordResetConfirmation: { password: 'newpassword' },
      }),
    );

    expect('error' in first).toBe(false);
    expect('error' in second && second.error).toMatchObject({ status: 404 });
  });
});

describe('deleting an account', () => {
  it('refuses without the right password', async () => {
    const store = mockedStore();

    const result = await store.dispatch(
      voltiqueApi.endpoints.deleteAccount.initiate({
        accountDeletionRequest: { password: 'not-it' },
      }),
    );

    expect('error' in result && result.error).toMatchObject({ status: 403 });
  });

  it('takes the households with it', async () => {
    const store = mockedStore();

    await store.dispatch(
      voltiqueApi.endpoints.deleteAccount.initiate({
        accountDeletionRequest: { password: 'password1' },
      }),
    );

    const households = await run(store.dispatch(voltiqueApi.endpoints.listHouseholds.initiate({})));
    expect(households.data?.data).toEqual([]);
  });
});
