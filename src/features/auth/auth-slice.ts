import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AuthSession, AuthTokens, AuthUser } from './types';

export type AuthStatus =
  /** Stored session not read yet. The app shows the splash until this resolves. */
  'restoring' | 'signedOut' | 'signedIn';

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  tokens: AuthTokens | null;
};

const initialState: AuthState = {
  status: 'restoring',
  user: null,
  tokens: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Result of reading secure storage at startup. */
    sessionRestored(state, action: PayloadAction<AuthSession | null>) {
      const session = action.payload;
      state.status = session ? 'signedIn' : 'signedOut';
      state.user = session?.user ?? null;
      state.tokens = session?.tokens ?? null;
    },
    signedIn(state, action: PayloadAction<AuthSession>) {
      state.status = 'signedIn';
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
    },
    tokensRefreshed(state, action: PayloadAction<AuthTokens>) {
      state.tokens = action.payload;
    },
    signedOut(state) {
      state.status = 'signedOut';
      state.user = null;
      state.tokens = null;
    },
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectCurrentUser: (state) => state.user,
    selectAccessToken: (state) => state.tokens?.accessToken ?? null,
    selectRefreshToken: (state) => state.tokens?.refreshToken ?? null,
    selectRole: (state) => state.user?.role ?? null,
  },
});

export const { sessionRestored, signedIn, signedOut, tokensRefreshed } = authSlice.actions;

export const {
  selectAccessToken,
  selectAuthStatus,
  selectCurrentUser,
  selectRefreshToken,
  selectRole,
} = authSlice.selectors;

export const authReducer = authSlice.reducer;
export const AUTH_SLICE_NAME = authSlice.name;
