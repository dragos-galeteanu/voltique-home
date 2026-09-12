import { Redirect, Stack, useSegments } from 'expo-router';

import { selectAuthStatus, selectRole } from '@/features/auth/auth-slice';
import { ROLE_HOME } from '@/features/auth/role-gate';
import { useAppSelector } from '@/store/hooks';

/**
 * Setting a new password is the exception to sending a signed-in person away: someone can
 * follow a reset link on a phone where they are still signed in, and bouncing them to the
 * dashboard would leave them unable to change the password they came to change.
 */
const ALLOWED_WHILE_SIGNED_IN = ['reset-password'];

export default function AuthLayout() {
  const status = useAppSelector(selectAuthStatus);
  const role = useAppSelector(selectRole);
  const segments = useSegments();

  const onAllowedScreen = segments.some((segment) => ALLOWED_WHILE_SIGNED_IN.includes(segment));

  // An already signed-in person has no business on sign-in or sign-up.
  if (status === 'signedIn' && role && !onAllowedScreen) return <Redirect href={ROLE_HOME[role]} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
