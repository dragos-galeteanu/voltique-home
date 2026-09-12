import { type Href, Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { useAppSelector } from '@/store/hooks';

import { selectAuthStatus, selectRole } from './auth-slice';
import type { UserRole } from './types';

export const ROLE_HOME: Record<UserRole, Href> = {
  consumer: '/consumer/dashboard',
  installer: '/installer/households',
};

export const SIGN_IN_ROUTE: Href = '/sign-in';

/**
 * Guards a navigation group. Signed-out users go to sign in, and a user whose role
 * does not match the group is sent to their own shell rather than shown an error.
 */
export function RoleGate({ role, children }: { role: UserRole; children: ReactNode }) {
  const status = useAppSelector(selectAuthStatus);
  const currentRole = useAppSelector(selectRole);

  if (status === 'restoring') return null;
  if (status === 'signedOut') return <Redirect href={SIGN_IN_ROUTE} />;
  if (currentRole && currentRole !== role) return <Redirect href={ROLE_HOME[currentRole]} />;

  return <>{children}</>;
}
