import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { useSignUpMutation } from '@/api/generated/endpoints';
import { getErrorMessage, getProblem } from '@/api/problem';
import { Button, Surface, Text, TextField, useToast } from '@/design-system';
import { useAppDispatch } from '@/store/hooks';

import { signedIn } from './auth-slice';
import type { UserRole } from './types';

type TranslateKey =
  | 'auth.invalidEmail'
  | 'auth.shortPassword'
  | 'account.nameRequired'
  | 'account.nameTooLong'
  | 'account.passwordsDiffer';

/** Built per render so validation messages follow the active language. */
function buildSchema(t: (key: TranslateKey) => string) {
  return z
    .object({
      displayName: z.string().min(1, t('account.nameRequired')).max(80, t('account.nameTooLong')),
      email: z.email(t('auth.invalidEmail')),
      password: z.string().min(8, t('auth.shortPassword')),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t('account.passwordsDiffer'),
      path: ['confirmPassword'],
    });
}

type SignUpValues = z.infer<ReturnType<typeof buildSchema>>;

export function SignUpForm() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [signUp, { isLoading, error }] = useSignUpMutation();

  const schema = useMemo(() => buildSchema(t), [t]);

  const { control, handleSubmit } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: SignUpValues) {
    try {
      const session = await signUp({
        registrationRequest: {
          displayName: values.displayName,
          email: values.email,
          password: values.password,
        },
      }).unwrap();

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
      showToast({ message: t('account.signUpFailed'), tone: 'danger' });
    }
  }

  // The one failure worth wording ourselves, since it tells the person what to do next.
  const alreadyRegistered = getProblem(error)?.code === 'email_already_registered';

  return (
    <Surface gap="lg">
      <Controller
        control={control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextField
            label={t('account.name')}
            autoComplete="name"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder={t('account.namePlaceholder')}
            testID="sign-up-name"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

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
            testID="sign-up-email"
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
            autoComplete="new-password"
            hint={t('account.passwordHint')}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            testID="sign-up-password"
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
            testID="sign-up-confirm"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      {error ? (
        <Text tone="danger" variant="caption" testID="sign-up-error">
          {alreadyRegistered
            ? t('account.emailTaken')
            : getErrorMessage(error, t('account.signUpFailed'))}
        </Text>
      ) : null}

      <Button
        label={t('account.createAccount')}
        size="lg"
        loading={isLoading}
        onPress={() => void handleSubmit(onSubmit)()}
        testID="sign-up-submit"
      />
    </Surface>
  );
}
