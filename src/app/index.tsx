import { Redirect } from 'expo-router';

import { selectAuthStatus, selectRole } from '@/features/auth/auth-slice';
import { ROLE_HOME, SIGN_IN_ROUTE } from '@/features/auth/role-gate';
import { selectPendingInvite } from '@/features/invites/invite-slice';
import { useAppSelector } from '@/store/hooks';

/**
 * Entry route. It only decides where the user belongs; the splash stays up while the
 * stored session is still being read.
 */
export default function IndexRoute() {
  const status = useAppSelector(selectAuthStatus);
  const role = useAppSelector(selectRole);
  const pendingInvite = useAppSelector(selectPendingInvite);

  if (status === 'restoring') return null;
  if (status !== 'signedIn' || !role) return <Redirect href={SIGN_IN_ROUTE} />;

  // Someone who followed an invitation link should land on it, not on their dashboard.
  if (pendingInvite) return <Redirect href={`/invite/${pendingInvite}`} />;

  return <Redirect href={ROLE_HOME[role]} />;
}
