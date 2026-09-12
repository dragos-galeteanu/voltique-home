import { Screen, StatusPill, Surface, Text } from '@/design-system';

export type PlaceholderScreenProps = {
  title: string;
  description: string;
  /** Which milestone fills this in, so a stub is never mistaken for a bug. */
  milestone: string;
  testID?: string;
};

export function PlaceholderScreen({
  title,
  description,
  milestone,
  testID,
}: PlaceholderScreenProps) {
  return (
    <Screen testID={testID}>
      <Text variant="display">{title}</Text>
      <Surface gap="lg">
        <StatusPill label={`Planned for ${milestone}`} tone="info" />
        <Text tone="secondary">{description}</Text>
      </Surface>
    </Screen>
  );
}
