import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateHouseholdMutation } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { Button, Screen, Surface, Text, TextField, useToast } from '@/design-system';
import { householdSelected } from '@/features/household/household-slice';
import { useAppDispatch } from '@/store/hooks';

const schema = z.object({
  name: z.string().min(1, 'Give the household a name').max(80, 'Keep it under 80 characters'),
  timezone: z.string().min(1, 'A timezone is required'),
});

type Values = z.infer<typeof schema>;

export default function NewHouseholdScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [createHousehold, { isLoading }] = useCreateHouseholdMutation();

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
      showToast({ message: `${household.name} created`, tone: 'success' });
      router.back();
    } catch (error) {
      showToast({ message: getErrorMessage(error, 'Could not create it'), tone: 'danger' });
    }
  }

  return (
    <Screen scrollable testID="new-household-screen">
      <Text variant="display">New household</Text>

      <Surface gap="lg">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <TextField
              label="Name"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Maple Street"
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
              label="Timezone"
              autoCapitalize="none"
              hint="Daily and monthly totals are bucketed in this zone."
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              testID="household-timezone"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Button
          label="Create household"
          size="lg"
          loading={isLoading}
          onPress={() => void handleSubmit(onSubmit)()}
          testID="submit-household"
        />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Surface>
    </Screen>
  );
}
