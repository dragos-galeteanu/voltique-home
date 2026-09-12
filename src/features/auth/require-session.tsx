import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAppSelector } from '@/store/hooks';

import { selectAuthStatus } from './auth-slice';
import { SIGN_IN_ROUTE } from './role-gate';

/**
 * Guards a route that both roles can reach, such as an asset's device log. Role specific
 * shells use RoleGate instead.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const status = useAppSelector(selectAuthStatus);

  if (status === 'restoring') return null;
  if (status === 'signedOut') return <Redirect href={SIGN_IN_ROUTE} />;

  return <>{children}</>;
}
