import { Redirect, Stack } from 'expo-router';

import { selectAuthStatus, selectRole } from '@/features/auth/auth-slice';
import { ROLE_HOME } from '@/features/auth/role-gate';
import { useAppSelector } from '@/store/hooks';

export default function AuthLayout() {
  const status = useAppSelector(selectAuthStatus);
  const role = useAppSelector(selectRole);

  // An already signed-in user has no business on the sign-in screen.
  if (status === 'signedIn' && role) return <Redirect href={ROLE_HOME[role]} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
