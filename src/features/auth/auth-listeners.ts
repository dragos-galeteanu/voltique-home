import { isAnyOf, type ListenerMiddlewareInstance } from '@reduxjs/toolkit';

import type { AuthState } from './auth-slice';
import { signedIn, signedOut, tokensRefreshed } from './auth-slice';
import { clearStoredSession, writeStoredSession } from './token-storage';

type StartListening = ListenerMiddlewareInstance['startListening'];

/**
 * Mirrors the session into secure storage whenever it changes, so a cold start can
 * restore it. Registered once per store.
 */
export function registerAuthListeners(startListening: StartListening) {
  startListening({
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

  startListening({
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
