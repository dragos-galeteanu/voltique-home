import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/design-system';
import { SignUpForm } from '@/features/auth/sign-up-form';

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Screen scrollable testID="sign-up-screen">
      <View style={{ gap: 4, marginTop: 32 }}>
        <Text variant="display">{t('account.signUpTitle')}</Text>
        <Text tone="secondary">{t('account.signUpSubtitle')}</Text>
      </View>

      <SignUpForm />

      <Button
        label={t('account.haveAccount')}
        variant="ghost"
        testID="go-to-sign-in"
        onPress={() => router.replace('/sign-in')}
      />
    </Screen>
  );
}
