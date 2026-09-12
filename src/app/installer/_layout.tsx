import { Stack } from 'expo-router';

import { RoleGate } from '@/features/auth/role-gate';

/**
 * Installer shell. Same shape as the consumer one: tabs in a group below a stack, so a
 * household opens over the tabs rather than inside one.
 */
export default function InstallerLayout() {
  return (
    <RoleGate role="installer">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="household/[householdId]" />
      </Stack>
    </RoleGate>
  );
}
