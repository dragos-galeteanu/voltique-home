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

/**
 * The slice of state this module needs. Typing it structurally rather than importing
 * RootState keeps the store from depending on the API client and back again.
 */
type AuthAwareState = { auth: AuthState };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  timeout: 20_000,
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
