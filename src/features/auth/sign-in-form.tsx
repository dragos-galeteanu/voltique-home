import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useSignInMutation } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { Button, Surface, Text, TextField, useToast } from '@/design-system';
import { useAppDispatch } from '@/store/hooks';

import { signedIn } from './auth-slice';
import type { UserRole } from './types';

/** Built per render of the screen so validation messages follow the active language. */
function buildSignInSchema(t: (key: 'auth.invalidEmail' | 'auth.shortPassword') => string) {
  return z.object({
    email: z.email(t('auth.invalidEmail')),
    password: z.string().min(8, t('auth.shortPassword')),
  });
}

type SignInValues = z.infer<ReturnType<typeof buildSignInSchema>>;

export function SignInForm() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [signIn, { isLoading, error }] = useSignInMutation();

  const schema = useMemo(() => buildSignInSchema(t), [t]);

  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: SignInValues) {
    try {
      const session = await signIn({ signInRequest: values }).unwrap();
      dispatch(
        signedIn({
          user: {
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.displayName,
            role: session.user.role as UserRole,
          },
          tokens: {
            accessToken: session.tokens.accessToken,
            refreshToken: session.tokens.refreshToken,
          },
        }),
      );
    } catch {
      // The rejection is already in `error`; the toast tells the user something happened.
      showToast({ message: t('auth.signInFailed'), tone: 'danger' });
    }
  }

  return (
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
            testID="sign-in-email"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            label={t('auth.password')}
            autoCapitalize="none"
            autoComplete="current-password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            testID="sign-in-password"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? (
        <Text tone="danger" variant="caption" testID="sign-in-error">
          {getErrorMessage(error, t('auth.signInFailed'))}
        </Text>
      ) : null}

      <Button
        label={t('auth.signIn')}
        size="lg"
        loading={isLoading}
        onPress={() => void handleSubmit(onSubmit)()}
        testID="sign-in-submit"
      />
    </Surface>
  );
}
