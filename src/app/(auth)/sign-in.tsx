import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Surface, Text, TextField, useToast } from '@/design-system';
import { signedIn } from '@/features/auth/auth-slice';
import type { UserRole } from '@/features/auth/types';
import { useAppDispatch } from '@/store/hooks';

/**
 * Sign in. The form and its validation are real; the submit path is a local stub
 * until the auth endpoints land in M2, which is why the role is chosen here.
 */
export default function SignInScreen() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('consumer');
  const [submitted, setSubmitted] = useState(false);

  const emailError = submitted && !email.includes('@') ? 'Enter a valid email address' : undefined;
  const passwordError = submitted && password.length < 8 ? 'At least 8 characters' : undefined;

  function onSubmit() {
    setSubmitted(true);
    if (!email.includes('@') || password.length < 8) return;

    dispatch(
      signedIn({
        user: {
          id: 'stub-user',
          email,
          displayName: email.split('@')[0] ?? 'There',
          role,
        },
        tokens: { accessToken: 'stub-access-token', refreshToken: 'stub-refresh-token' },
      }),
    );
    showToast({ message: `Signed in as ${role}`, tone: 'success' });
  }

  return (
    <Screen scrollable testID="sign-in-screen">
      <View style={{ gap: 4, marginTop: 32 }}>
        <Text variant="display">Voltique Home</Text>
        <Text tone="secondary">Track what your home makes, stores and uses.</Text>
      </View>

      <Surface gap="lg">
        <TextField
          label="Email"
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          testID="sign-in-email"
          value={email}
          error={emailError}
        />

        <TextField
          label="Password"
          autoCapitalize="none"
          autoComplete="current-password"
          onChangeText={setPassword}
          secureTextEntry
          testID="sign-in-password"
          value={password}
          error={passwordError}
        />

        <Button label="Sign in" size="lg" onPress={onSubmit} testID="sign-in-submit" />
      </Surface>

      <Surface gap="md">
        <Text variant="label" tone="muted">
          Development only, until the auth endpoints exist
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            label="Consumer"
            variant={role === 'consumer' ? 'primary' : 'secondary'}
            onPress={() => setRole('consumer')}
            style={{ flex: 1 }}
            testID="sign-in-role-consumer"
          />
          <Button
            label="Installer"
            variant={role === 'installer' ? 'primary' : 'secondary'}
            onPress={() => setRole('installer')}
            style={{ flex: 1 }}
            testID="sign-in-role-installer"
          />
        </View>
      </Surface>
    </Screen>
  );
}
