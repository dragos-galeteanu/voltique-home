import { skipToken } from '@reduxjs/toolkit/query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
      showToast({ message: `${name} removed`, tone: 'success' });
    } catch (error) {
      showToast({ message: getErrorMessage(error, 'Could not remove that asset'), tone: 'danger' });
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
        <Text variant="display">Assets</Text>
        <EmptyState
          title="No household yet"
          description="Create a household first. Assets, alerts and installer access all hang off it."
          action={{
            label: 'Create household',
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
          label="Add asset"
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
              title="No assets yet"
              description="Add a charger, inverter, battery or heat pump to start tracking this household."
              action={{ label: 'Add asset', onPress: () => router.push('/consumer/add-asset') }}
              testID="assets-empty"
            />
          }
        />
      )}

      <Sheet
        visible={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        title={`Remove ${pendingRemoval?.name ?? 'asset'}?`}
        testID="remove-asset-sheet"
      >
        <Text tone="secondary">
          Its history stays on the server, but it stops appearing in this household and no new
          readings are collected.
        </Text>
        <Button
          label="Remove"
          variant="danger"
          testID="confirm-remove-asset"
          onPress={() => void confirmRemoval()}
        />
        <Button label="Cancel" variant="ghost" onPress={() => setPendingRemoval(null)} />
      </Sheet>
    </Screen>
  );
}
