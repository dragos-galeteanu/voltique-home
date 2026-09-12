import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Screen, Surface, Text } from '@/design-system';
import { signedIn } from '@/features/auth/auth-slice';
import { SignInForm } from '@/features/auth/sign-in-form';
import { useAppDispatch } from '@/store/hooks';

export default function SignInScreen() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return (
    <Screen scrollable testID="sign-in-screen">
      <View style={{ gap: 4, marginTop: 32 }}>
        <Text variant="display">{t('app.name')}</Text>
        <Text tone="secondary">{t('app.tagline')}</Text>
      </View>

      <SignInForm />

      {__DEV__ ? (
        <Surface gap="md">
          <Text variant="label" tone="muted">
            Development shortcut. The mock always signs you in as a consumer, so this is the only
            way into the installer shell until the backend can vary the role.
          </Text>
          <Button
            label={t('auth.continueAsInstaller')}
            variant="secondary"
            testID="sign-in-as-installer"
            onPress={() =>
              dispatch(
                signedIn({
                  user: {
                    id: 'dev-installer',
                    email: 'installer@example.com',
                    displayName: 'Dev Installer',
                    role: 'installer',
                  },
                  tokens: { accessToken: 'dev-access', refreshToken: 'dev-refresh' },
                }),
              )
            }
          />
        </Surface>
      ) : null}
    </Screen>
  );
}
