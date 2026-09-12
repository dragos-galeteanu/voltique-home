import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';

import { env } from '@/config/env';
import type { AuthState } from '@/features/auth/auth-slice';
import {
  selectAccessToken,
  selectRefreshToken,
  signedOut,
  tokensRefreshed,
} from '@/features/auth/auth-slice';
import type { AuthTokens } from '@/features/auth/types';
import type { DevState } from '@/features/dev/dev-slice';
import { fixtureBaseQuery } from '@/mocks/fixture-base-query';

/**
 * The slice of state this module needs. Typing it structurally rather than importing
 * RootState keeps the store from depending on the API client and back again.
 */
type AuthAwareState = {
  auth: AuthState;
  network?: { online: boolean | null };
  dev?: DevState;
};

/** Problem details for a write attempted with no connection, worded like any other. */
const OFFLINE_PROBLEM = {
  status: 503,
  data: {
    title: 'offline',
    status: 503,
    code: 'client_offline',
  },
} as const;

/** How long a single request may take before it is abandoned. */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Applies the timeout ourselves rather than through fetchBaseQuery's `timeout` option.
 * That option schedules an abort timer it never clears, so every completed request would
 * leave a timer pending for the full twenty seconds.
 */
async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  fetchFn: fetchWithTimeout,
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as AuthAwareState);
    if (token) headers.set('authorization', `Bearer ${token}`);
    headers.set('accept', 'application/json');
    return headers;
  },
});

/**
 * Shared across concurrent 401s so that a burst of failing requests triggers one
 * refresh, not one per request.
 */
let refreshInFlight: Promise<AuthTokens | null> | null = null;

async function refreshTokens(
  api: Parameters<BaseQueryFn>[1],
  extraOptions: object,
): Promise<AuthTokens | null> {
  const refreshToken = selectRefreshToken(api.getState() as AuthAwareState);
  if (!refreshToken) return null;

  const result = await rawBaseQuery(
    {
      url: '/auth/sessions/refresh',
      method: 'POST',
      body: { refreshToken },
    },
    api,
    extraOptions,
  );

  if (result.error || !result.data) return null;
  return result.data as AuthTokens;
}

/**
 * Attaches the access token, and on a 401 refreshes once and replays the request.
 * A failed refresh signs the user out, which the navigation gate reacts to.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const state = api.getState() as AuthAwareState;

  // A development build running a mock scenario answers from the contract's examples
  // instead of the network. Release builds never reach this branch.
  if (__DEV__ && state.dev?.mockScenario) {
    return fixtureBaseQuery(args, api, extraOptions);
  }

  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET');
  const online = state.network?.online;

  // Reads fall through to the cache; writes are refused outright, because a queued write
  // the person cannot see is worse than being told it did not happen.
  if (online === false && method !== 'GET') {
    return { error: OFFLINE_PROBLEM as unknown as FetchBaseQueryError };
  }

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) return result;

  // The refresh call itself returning 401 means the refresh token is dead.
  const isRefreshCall = typeof args !== 'string' && args.url === '/auth/sessions/refresh';
  if (isRefreshCall) {
    api.dispatch(signedOut());
    return result;
  }

  refreshInFlight ??= refreshTokens(api, extraOptions).finally(() => {
    refreshInFlight = null;
  });

  const tokens = await refreshInFlight;

  if (!tokens) {
    api.dispatch(signedOut());
    return result;
  }

  api.dispatch(tokensRefreshed(tokens));
  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};
