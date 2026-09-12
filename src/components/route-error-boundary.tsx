import type { ErrorBoundaryProps } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Screen, Surface, Text } from '@/design-system';

/**
 * Fallback for render errors inside a route segment. Expo Router mounts this when a
 * layout exports it, which keeps a broken screen from taking down the whole app.
 */
export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();

  return (
    <Screen testID="route-error-boundary">
      <Surface gap="lg">
        <Text variant="title">{t('errors.renderTitle')}</Text>
        <Text tone="secondary">{error.message}</Text>
        <Button label={t('common.tryAgain')} onPress={() => void retry()} />
      </Surface>
    </Screen>
  );
}
