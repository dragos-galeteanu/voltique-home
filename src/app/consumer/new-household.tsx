import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useCreateHouseholdMutation } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { Button, Screen, Surface, Text, TextField, useToast } from '@/design-system';
import { householdSelected } from '@/features/household/household-slice';
import { useAppDispatch } from '@/store/hooks';

type TranslateKey =
  'household.nameRequired' | 'household.nameTooLong' | 'household.timezoneRequired';

function buildSchema(t: (key: TranslateKey) => string) {
  return z.object({
    name: z.string().min(1, t('household.nameRequired')).max(80, t('household.nameTooLong')),
    timezone: z.string().min(1, t('household.timezoneRequired')),
  });
}

type Values = z.infer<ReturnType<typeof buildSchema>>;

export default function NewHouseholdScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [createHousehold, { isLoading }] = useCreateHouseholdMutation();

  const schema = useMemo(() => buildSchema(t), [t]);

  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      // Daily and monthly totals are bucketed in this zone, so it defaults to the device's.
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  async function onSubmit(values: Values) {
    try {
      const household = await createHousehold({ householdCreate: values }).unwrap();
      dispatch(householdSelected(household.id));
      showToast({ message: t('household.created', { name: household.name }), tone: 'success' });
      router.back();
    } catch (error) {
      showToast({
        message: getErrorMessage(error, t('household.createFailed')),
        tone: 'danger',
      });
    }
  }

  return (
    <Screen scrollable testID="new-household-screen">
      <Text variant="display">{t('household.newTitle')}</Text>

      <Surface gap="lg">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label={t('household.name')}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={t('household.namePlaceholder')}
              testID="household-name"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="timezone"
          render={({ field, fieldState }) => (
            <TextField
              label={t('household.timezone')}
              autoCapitalize="none"
              hint={t('household.timezoneHint')}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              testID="household-timezone"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Button
          label={t('household.create')}
          size="lg"
          loading={isLoading}
          onPress={() => void handleSubmit(onSubmit)()}
          testID="submit-household"
        />
        <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
      </Surface>
    </Screen>
  );
}
