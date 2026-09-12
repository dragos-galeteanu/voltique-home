import { Stack } from 'expo-router';

import { RoleGate } from '@/features/auth/role-gate';

/**
 * Consumer shell. The tabs live in a group below this stack so that flows such as
 * adding an asset can cover them instead of being squeezed into a tab.
 */
export default function ConsumerLayout() {
  return (
    <RoleGate role="consumer">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="asset/[assetId]" />
        <Stack.Screen name="add-asset" options={{ presentation: 'modal' }} />
        <Stack.Screen name="new-household" options={{ presentation: 'modal' }} />
      </Stack>
    </RoleGate>
  );
}
