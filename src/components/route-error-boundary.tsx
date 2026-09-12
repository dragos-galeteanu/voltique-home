import type { ErrorBoundaryProps } from 'expo-router';

import { Button, Screen, Surface, Text } from '@/design-system';

/**
 * Fallback for render errors inside a route segment. Expo Router mounts this when a
 * layout exports it, which keeps a broken screen from taking down the whole app.
 */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <Screen testID="route-error-boundary">
      <Surface gap="lg">
        <Text variant="title">Something went wrong</Text>
        <Text tone="secondary">{error.message}</Text>
        <Button label="Try again" onPress={() => void retry()} />
      </Surface>
    </Screen>
  );
}
