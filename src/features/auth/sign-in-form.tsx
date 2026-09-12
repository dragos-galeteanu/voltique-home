import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSignInMutation } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { Button, Surface, Text, TextField, useToast } from '@/design-system';
import { useAppDispatch } from '@/store/hooks';

import { signedIn } from './auth-slice';
import type { UserRole } from './types';

const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'At least 8 characters'),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [signIn, { isLoading, error }] = useSignInMutation();

  const { control, handleSubmit } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
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
      showToast({ message: 'Could not sign you in', tone: 'danger' });
    }
  }

  return (
    <Surface gap="lg">
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            label="Email"
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="you@example.com"
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
            label="Password"
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
          {getErrorMessage(error, 'Could not sign you in')}
        </Text>
      ) : null}

      <Button
        label="Sign in"
        size="lg"
        loading={isLoading}
        onPress={() => void handleSubmit(onSubmit)()}
        testID="sign-in-submit"
      />
    </Surface>
  );
}
