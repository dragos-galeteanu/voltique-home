import { skipToken } from '@reduxjs/toolkit/query';
import { useRouter } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import {
  useCreateHouseholdAssetMutation,
  useListAssetTypesQuery,
  useListManufacturerModelsQuery,
  useListManufacturersQuery,
} from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button, Screen, Surface, Text, useTheme, useToast } from '@/design-system';
import { ConnectForm, type ConnectValues } from '@/features/assets/connect-form';
import { useSelectedHousehold } from '@/features/household/use-selected-household';
import { formatPower } from '@/lib/format-energy';

/**
 * Add an asset: pick what it is, who made it and which model, then supply whatever that
 * model needs to be reached. Every step is driven by the catalogue, so the app carries
 * no manufacturer-specific knowledge.
 */
export default function AddAssetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const { household } = useSelectedHousehold();

  const [assetTypeId, setAssetTypeId] = useState<string | null>(null);
  const [manufacturerId, setManufacturerId] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);

  const assetTypes = useListAssetTypesQuery();
  const manufacturers = useListManufacturersQuery(assetTypeId ? { assetTypeId } : skipToken);
  const models = useListManufacturerModelsQuery(manufacturerId ? { manufacturerId } : skipToken);
  const [createAsset, { isLoading: creating }] = useCreateHouseholdAssetMutation();

  const model = models.data?.find((candidate) => candidate.id === modelId) ?? null;

  async function onSubmit(values: ConnectValues) {
    if (!household || !assetTypeId || !manufacturerId || !modelId) return;

    try {
      const asset = await createAsset({
        householdId: household.id,
        assetCreate: {
          name: values.name,
          assetTypeId,
          manufacturerId,
          modelId,
          credentials: values.credentials,
        },
      }).unwrap();

      showToast({ message: t('addAsset.connecting', { name: asset.name }), tone: 'success' });
      router.back();
    } catch (error) {
      showToast({
        message: getErrorMessage(error, t('addAsset.failed')),
        tone: 'danger',
      });
    }
  }

  if (!household) {
    return (
      <Screen testID="add-asset-screen">
        <EmptyState
          title={t('addAsset.needHouseholdTitle')}
          description={t('addAsset.needHouseholdDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable testID="add-asset-screen">
      <View style={{ gap: 4 }}>
        <Text variant="display">{t('addAsset.title')}</Text>
        <Text tone="secondary">{t('addAsset.toHousehold', { name: household.name })}</Text>
      </View>

      <Step title={t('addAsset.stepType')} step={1}>
        {assetTypes.isLoading ? (
          <LoadingState />
        ) : assetTypes.error ? (
          <ErrorState error={assetTypes.error} onRetry={() => void assetTypes.refetch()} />
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {(assetTypes.data ?? []).map((type) => (
              <Option
                key={type.id}
                label={type.name}
                detail={type.category}
                selected={assetTypeId === type.id}
                testID={`asset-type-${type.id}`}
                onPress={() => {
                  setAssetTypeId(type.id);
                  setManufacturerId(null);
                  setModelId(null);
                }}
              />
            ))}
          </View>
        )}
      </Step>

      {assetTypeId ? (
        <Step title={t('addAsset.stepManufacturer')} step={2}>
          {manufacturers.isLoading ? (
            <LoadingState />
          ) : manufacturers.error ? (
            <ErrorState error={manufacturers.error} onRetry={() => void manufacturers.refetch()} />
          ) : (manufacturers.data ?? []).length === 0 ? (
            <Text tone="secondary">{t('addAsset.noManufacturers')}</Text>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {(manufacturers.data ?? []).map((manufacturer) => (
                <Option
                  key={manufacturer.id}
                  label={manufacturer.name}
                  selected={manufacturerId === manufacturer.id}
                  testID={`manufacturer-${manufacturer.id}`}
                  onPress={() => {
                    setManufacturerId(manufacturer.id);
                    setModelId(null);
                  }}
                />
              ))}
            </View>
          )}
        </Step>
      ) : null}

      {manufacturerId ? (
        <Step title={t('addAsset.stepModel')} step={3}>
          {models.isLoading ? (
            <LoadingState />
          ) : models.error ? (
            <ErrorState error={models.error} onRetry={() => void models.refetch()} />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {(models.data ?? []).map((candidate) => (
                <Option
                  key={candidate.id}
                  label={candidate.name}
                  detail={
                    candidate.ratedPowerW
                      ? t('addAsset.ratedPower', { power: formatPower(candidate.ratedPowerW) })
                      : undefined
                  }
                  selected={modelId === candidate.id}
                  testID={`model-${candidate.id}`}
                  onPress={() => setModelId(candidate.id)}
                />
              ))}
            </View>
          )}
        </Step>
      ) : null}

      {model ? <ConnectForm model={model} submitting={creating} onSubmit={onSubmit} /> : null}

      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

function Step({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <Surface gap="md">
      <Text variant="label" tone="muted">
        {t('addAsset.step', { number: step })}
      </Text>
      <Text variant="heading">{title}</Text>
      {children}
    </Surface>
  );
}

function Option({
  label,
  detail,
  selected,
  onPress,
  testID,
}: {
  label: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={{
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        backgroundColor: selected ? theme.colors.accentMuted : 'transparent',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: 2,
      }}
    >
      <Text variant="heading">{label}</Text>
      {detail ? (
        <Text variant="caption" tone="muted">
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}
