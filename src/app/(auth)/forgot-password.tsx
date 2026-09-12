import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { useRequestPasswordResetMutation } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { Button, Screen, Surface, Text, TextField } from '@/design-system';

/**
 * Asking for a reset link.
 *
 * The answer is the same whether or not the address has an account, matching what the API
 * does, because telling someone which addresses exist turns this into a way to enumerate
 * accounts.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [requestReset, { isLoading, error }] = useRequestPasswordResetMutation();
  const [sent, setSent] = useState(false);

  const schema = useMemo(() => z.object({ email: z.email(t('auth.invalidEmail')) }), [t]);

  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: { email: string }) {
    try {
      await requestReset({ passwordResetRequest: { email: values.email } }).unwrap();
      setSent(true);
    } catch {
      // Surfaced below; the screen stays put so the address can be corrected.
    }
  }

  return (
    <Screen scrollable testID="forgot-password-screen">
      <View style={{ gap: 4, marginTop: 32 }}>
        <Text variant="display">{t('account.resetTitle')}</Text>
        <Text tone="secondary">{t('account.resetSubtitle')}</Text>
      </View>

      {sent ? (
        <Surface gap="lg">
          <Text testID="reset-sent">{t('account.resetSent')}</Text>
          <Button
            label={t('common.back')}
            testID="reset-back"
            onPress={() => router.replace('/sign-in')}
          />
        </Surface>
      ) : (
        <Surface gap="lg">
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <TextField
                label={t('auth.email')}
                autoCapitalize="none"
                autoComplete="email"
                inputMode="email"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder={t('auth.emailPlaceholder')}
                testID="reset-email"
                value={field.value}
                error={fieldState.error?.message}
              />
            )}
          />

          {error ? (
            <Text tone="danger" variant="caption" testID="reset-error">
              {getErrorMessage(error, t('account.resetFailed'))}
            </Text>
          ) : null}

          <Button
            label={t('account.sendResetLink')}
            size="lg"
            loading={isLoading}
            onPress={() => void handleSubmit(onSubmit)()}
            testID="reset-submit"
          />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => router.replace('/sign-in')}
          />
        </Surface>
      )}
    </Screen>
  );
}
