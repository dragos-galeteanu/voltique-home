import { isAnyOf } from '@reduxjs/toolkit';

import { startAppListening } from '@/store/listener';

import type { AuthState } from './auth-slice';
import { signedIn, signedOut, tokensRefreshed } from './auth-slice';
import { clearStoredSession, writeStoredSession } from './token-storage';

/**
 * Mirrors the session into secure storage whenever it changes, so a cold start can
 * restore it. Registered once at store creation.
 */
export function registerAuthListeners() {
  startAppListening({
    matcher: isAnyOf(signedIn, tokensRefreshed),
    effect: async (_action, listenerApi) => {
      const { auth } = listenerApi.getState() as { auth: AuthState };
      if (!auth.user || !auth.tokens) return;

      try {
        await writeStoredSession({ user: auth.user, tokens: auth.tokens });
      } catch (error) {
        // Persistence failing must not break the running session, only the next start.
        console.warn('Failed to persist session', error);
      }
    },
  });

  startAppListening({
    actionCreator: signedOut,
    effect: async () => {
      try {
        await clearStoredSession();
      } catch (error) {
        console.warn('Failed to clear stored session', error);
      }
    },
  });
}
