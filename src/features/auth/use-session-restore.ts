import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';

import { sessionRestored } from './auth-slice';
import { readStoredSession } from './token-storage';

/**
 * Reads the persisted session once at startup. Until it resolves, auth status stays
 * "restoring" and the splash screen is held, so no screen flashes the wrong shell.
 */
export function useSessionRestore() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    void readStoredSession().then((session) => {
      if (!cancelled) dispatch(sessionRestored(session));
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);
}
