import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { useConfirmPasswordResetMutation } from '@/api/generated/endpoints';
import { getErrorMessage, getProblem } from '@/api/problem';
import { Button, Screen, Surface, Text, TextField, useToast } from '@/design-system';

type TranslateKey = 'auth.shortPassword' | 'account.passwordsDiffer';

function buildSchema(t: (key: TranslateKey) => string) {
  return z
    .object({
      password: z.string().min(8, t('auth.shortPassword')),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t('account.passwordsDiffer'),
      path: ['confirmPassword'],
    });
}

/**
 * Where a reset link lands, `voltique://reset-password/<token>`. Reachable signed out,
 * which is the whole point: someone who cannot sign in has to be able to get here.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const { token } = useLocalSearchParams<{ token: string }>();
  const [confirmReset, { isLoading, error }] = useConfirmPasswordResetMutation();

  const schema = useMemo(() => buildSchema(t), [t]);
  const { control, handleSubmit } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: { password: string }) {
    if (!token) return;

    try {
      await confirmReset({
        token,
        passwordResetConfirmation: { password: values.password },
      }).unwrap();

      showToast({ message: t('account.passwordChanged'), tone: 'success' });
      router.replace('/sign-in');
    } catch {
      // Shown below. Every session was revoked server-side, so signing in is the next step.
    }
  }

  const linkInvalid = getProblem(error)?.code === 'reset_token_invalid';

  return (
    <Screen scrollable testID="reset-password-screen">
      <View style={{ gap: 4, marginTop: 32 }}>
        <Text variant="display">{t('account.newPasswordTitle')}</Text>
      </View>

      <Surface gap="lg">
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <TextField
              label={t('account.newPassword')}
              autoCapitalize="none"
              autoComplete="new-password"
              hint={t('account.passwordHint')}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry
              testID="new-password"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextField
              label={t('account.confirmPassword')}
              autoCapitalize="none"
              autoComplete="new-password"
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              secureTextEntry
              testID="new-password-confirm"
              value={field.value}
              error={fieldState.error?.message}
            />
          )}
        />

        {error ? (
          <Text tone="danger" variant="caption" testID="reset-password-error">
            {linkInvalid
              ? t('account.resetLinkInvalid')
              : getErrorMessage(error, t('account.resetFailed'))}
          </Text>
        ) : null}

        <Button
          label={t('account.setPassword')}
          size="lg"
          loading={isLoading}
          onPress={() => void handleSubmit(onSubmit)()}
          testID="reset-password-submit"
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={() => router.replace('/sign-in')}
        />
      </Surface>
    </Screen>
  );
}
