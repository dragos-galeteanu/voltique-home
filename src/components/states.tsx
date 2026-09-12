import { ActivityIndicator, View } from 'react-native';

import { getErrorMessage, isRetryable } from '@/api/problem';
import { Button, Surface, Text, useTheme } from '@/design-system';

/** Full-width spinner for a first load, when there is nothing to show yet. */
export function LoadingState({ testID }: { testID?: string }) {
  const theme = useTheme();
  return (
    <View style={{ paddingVertical: theme.spacing.xxxl }} testID={testID}>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action,
  testID,
}: {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
  testID?: string;
}) {
  return (
    <Surface gap="md" testID={testID}>
      <Text variant="heading">{title}</Text>
      <Text tone="secondary">{description}</Text>
      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </Surface>
  );
}

/**
 * Error panel for a failed query. Retry only appears when retrying could actually
 * help, so a permission failure does not offer a pointless button.
 */
export function ErrorState({
  error,
  onRetry,
  testID = 'error-state',
}: {
  error: unknown;
  onRetry?: () => void;
  testID?: string;
}) {
  return (
    <Surface gap="md" testID={testID}>
      <Text variant="heading" tone="danger">
        That did not work
      </Text>
      <Text tone="secondary">{getErrorMessage(error)}</Text>
      {onRetry && isRetryable(error) ? (
        <Button label="Try again" variant="secondary" onPress={onRetry} testID="retry" />
      ) : null}
    </Surface>
  );
}
