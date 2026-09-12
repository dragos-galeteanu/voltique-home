import { Stack } from 'expo-router';

import { RequireSession } from '@/features/auth/require-session';

/** Device logs are reachable by a consumer and by an installer scoped to the household. */
export default function LogsLayout() {
  return (
    <RequireSession>
      <Stack screenOptions={{ headerShown: false }} />
    </RequireSession>
  );
}
