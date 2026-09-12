import { skipToken } from '@reduxjs/toolkit/query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { useListHouseholdAssetsQuery } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button, Screen, Sheet, Text, useTheme, useToast } from '@/design-system';
import { useDeleteAssetMutation } from '@/features/assets/asset-endpoints';
import { AssetRow } from '@/features/assets/asset-row';
import { HouseholdSwitcher } from '@/features/household/household-switcher';
import { useSelectedHousehold } from '@/features/household/use-selected-household';

export default function AssetsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const households = useSelectedHousehold();
  const householdId = households.selectedHouseholdId;

  const assets = useListHouseholdAssetsQuery(householdId ? { householdId } : skipToken);
  const [deleteAsset] = useDeleteAssetMutation();
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; name: string } | null>(null);

  async function confirmRemoval() {
    if (!pendingRemoval) return;
    const { id, name } = pendingRemoval;
    setPendingRemoval(null);

    try {
      await deleteAsset({ assetId: id }).unwrap();
      showToast({ message: t('assets.removed', { name }), tone: 'success' });
    } catch (error) {
      showToast({
        message: getErrorMessage(error, t('assets.removeFailed')),
        tone: 'danger',
      });
    }
  }

  if (households.isLoading) {
    return (
      <Screen testID="consumer-assets">
        <LoadingState testID="households-loading" />
      </Screen>
    );
  }

  if (households.error) {
    return (
      <Screen testID="consumer-assets">
        <ErrorState error={households.error} onRetry={() => void households.refetch()} />
      </Screen>
    );
  }

  if (!households.household) {
    return (
      <Screen testID="consumer-assets">
        <Text variant="display">{t('assets.title')}</Text>
        <EmptyState
          title={t('household.emptyTitle')}
          description={t('household.emptyDescription')}
          action={{
            label: t('household.create'),
            onPress: () => router.push('/consumer/new-household'),
          }}
          testID="no-household"
        />
      </Screen>
    );
  }

  return (
    <Screen testID="consumer-assets">
      <View style={{ gap: theme.spacing.md }}>
        <HouseholdSwitcher households={households.households} selected={households.household} />
        <Button
          label={t('assets.add')}
          testID="add-asset"
          onPress={() => router.push('/consumer/add-asset')}
        />
      </View>

      {assets.isLoading ? (
        <LoadingState testID="assets-loading" />
      ) : assets.error ? (
        <ErrorState error={assets.error} onRetry={() => void assets.refetch()} />
      ) : (
        <FlatList
          data={assets.data?.data ?? []}
          keyExtractor={(asset) => asset.id}
          contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={assets.isFetching && !assets.isLoading}
              onRefresh={() => void assets.refetch()}
              tintColor={theme.colors.textMuted}
            />
          }
          renderItem={({ item }) => (
            <AssetRow
              asset={item}
              onLongPress={() => setPendingRemoval({ id: item.id, name: item.name })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('assets.emptyTitle')}
              description={t('assets.emptyDescription')}
              action={{ label: t('assets.add'), onPress: () => router.push('/consumer/add-asset') }}
              testID="assets-empty"
            />
          }
        />
      )}

      <Sheet
        visible={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        title={t('assets.removeTitle', { name: pendingRemoval?.name ?? '' })}
        testID="remove-asset-sheet"
      >
        <Text tone="secondary">{t('assets.removeExplanation')}</Text>
        <Button
          label={t('common.remove')}
          variant="danger"
          testID="confirm-remove-asset"
          onPress={() => void confirmRemoval()}
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={() => setPendingRemoval(null)}
        />
      </Sheet>
    </Screen>
  );
}
