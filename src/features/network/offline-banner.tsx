import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text, useTheme } from '@/design-system';
import { formatRelativeTime } from '@/lib/format-energy';
import { useAppSelector } from '@/store/hooks';
import { selectRestoredAt } from '@/store/persistence/cache-slice';

import { selectIsOffline } from './network-slice';

/**
 * Says the app is offline and how old what you are looking at is. Shown app-wide rather
 * than per screen, because every screen is affected the same way.
 */
export function OfflineBanner() {
  const theme = useTheme();
  const { t } = useTranslation();

  const offline = useAppSelector(selectIsOffline);
  const restoredAt = useAppSelector(selectRestoredAt);

  if (!offline) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      testID="offline-banner"
      style={{
        backgroundColor: theme.colors.surfaceElevated,
        borderBottomColor: theme.colors.warning,
        borderBottomWidth: 2,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: 2,
      }}
    >
      <Text variant="label" tone="warning">
        {t('network.offline')}
      </Text>
      {restoredAt ? (
        <Text variant="caption" tone="muted">
          {t('network.showingCached', { time: formatRelativeTime(restoredAt) })}
        </Text>
      ) : null}
    </View>
  );
}
