import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useListHouseholdsQuery } from '@/api/generated/endpoints';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Screen, StatusPill, Surface, Text, useTheme } from '@/design-system';

/**
 * The estate an installer looks after. These are the households that invited them, and
 * the server decides which fields they may see.
 */
export default function InstallerHouseholdsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const households = useListHouseholdsQuery({});

  return (
    <Screen testID="installer-households">
      <Text variant="display">{t('tabs.households')}</Text>

      {households.isLoading ? (
        <LoadingState testID="installer-households-loading" />
      ) : households.error ? (
        <ErrorState error={households.error} onRetry={() => void households.refetch()} />
      ) : (
        <FlatList
          data={households.data?.data ?? []}
          keyExtractor={(household) => household.id}
          contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={households.isFetching && !households.isLoading}
              onRefresh={() => void households.refetch()}
              tintColor={theme.colors.textMuted}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.name}
              onPress={() => router.push(`/installer/household/${item.id}`)}
              testID={`installer-household-${item.id}`}
            >
              <Surface gap="md">
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    gap: theme.spacing.md,
                  }}
                >
                  <Text variant="heading" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {item.name}
                  </Text>
                  {item.openAlertCount ? (
                    <StatusPill
                      label={t('installer.openFaults', { count: item.openAlertCount })}
                      tone="danger"
                      testID={`installer-household-alerts-${item.id}`}
                    />
                  ) : (
                    <StatusPill label={t('installer.healthy')} tone="success" />
                  )}
                </View>
                <Text variant="caption" tone="muted">
                  {t('household.assetCount', { count: item.assetCount })}
                </Text>
              </Surface>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('installer.emptyTitle')}
              description={t('installer.emptyDescription')}
              testID="installer-households-empty"
            />
          }
        />
      )}
    </Screen>
  );
}
