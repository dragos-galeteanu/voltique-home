import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';

import { Surface, Text, useTheme } from '@/design-system';
import { useAppSelector } from '@/store/hooks';

import { selectRecentEnabled, selectRecentItems } from './recent-slice';

/**
 * A shortcut back to what was opened recently. Renders nothing at all unless the person
 * turned recording on and there is something to show.
 */
export function RecentSection() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const enabled = useAppSelector(selectRecentEnabled);
  const items = useAppSelector(selectRecentItems);

  if (!enabled || items.length === 0) return null;

  return (
    <Surface gap="md" testID="recent-section">
      <Text variant="label" tone="muted">
        {t('recent.title')}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.spacing.sm }}
      >
        {items.map((item) => (
          <Pressable
            key={`${item.kind}-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() =>
              router.push(
                item.kind === 'asset'
                  ? `/consumer/asset/${item.id}`
                  : `/installer/household/${item.id}`,
              )
            }
            testID={`recent-${item.id}`}
            style={{
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              borderWidth: 1,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.sm,
            }}
          >
            <Text variant="label">{item.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Surface>
  );
}
