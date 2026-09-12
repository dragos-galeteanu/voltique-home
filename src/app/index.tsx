import { Redirect } from 'expo-router';

import { selectAuthStatus, selectRole } from '@/features/auth/auth-slice';
import { ROLE_HOME, SIGN_IN_ROUTE } from '@/features/auth/role-gate';
import { useAppSelector } from '@/store/hooks';

/**
 * Entry route. It only decides where the user belongs; the splash stays up while the
 * stored session is still being read.
 */
export default function IndexRoute() {
  const status = useAppSelector(selectAuthStatus);
  const role = useAppSelector(selectRole);

  if (status === 'restoring') return null;
  if (status === 'signedIn' && role) return <Redirect href={ROLE_HOME[role]} />;

  return <Redirect href={SIGN_IN_ROUTE} />;
}
