import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Screen, Surface, Text, type ThemePreference, useToast } from '@/design-system';
import { selectCurrentUser, signedOut } from '@/features/auth/auth-slice';
import {
  type LanguagePreference,
  languagePreferenceChanged,
  selectLanguagePreference,
  selectThemePreference,
  themePreferenceChanged,
} from '@/features/ui/ui-slice';
import { SUPPORTED_LOCALES } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const THEMES: {
  value: ThemePreference;
  labelKey: 'settings.themeSystem' | 'settings.themeLight' | 'settings.themeDark';
}[] = [
  { value: 'system', labelKey: 'settings.themeSystem' },
  { value: 'light', labelKey: 'settings.themeLight' },
  { value: 'dark', labelKey: 'settings.themeDark' },
];

/**
 * Each language is offered in its own name, since someone looking for German is looking
 * for "Deutsch", not for the English word.
 */
const LANGUAGE_NAMES: Record<LanguagePreference, string> = {
  system: 'System',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  es: 'Español',
};

/**
 * Shared by both roles. Account details come from the API in M3; appearance and sign
 * out are fully wired already.
 */
export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const user = useAppSelector(selectCurrentUser);
  const preference = useAppSelector(selectThemePreference);
  const language = useAppSelector(selectLanguagePreference);

  return (
    <Screen scrollable testID="settings-screen">
      <Text variant="display">{t('settings.title')}</Text>

      <Surface gap="sm">
        <Text variant="label" tone="muted">
          {t('settings.signedInAs')}
        </Text>
        <Text variant="heading">{user?.displayName ?? t('settings.unknownUser')}</Text>
        <Text tone="secondary">{user?.email ?? ''}</Text>
        <Text variant="caption" tone="muted">
          {t('settings.role', {
            role: user ? t(`roles.${user.role}`) : t('settings.roleNone'),
          })}
        </Text>
      </Surface>

      <Surface gap="md">
        <Text variant="heading">{t('settings.appearance')}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {THEMES.map((option) => (
            <Button
              key={option.value}
              label={t(option.labelKey)}
              variant={preference === option.value ? 'primary' : 'secondary'}
              onPress={() => dispatch(themePreferenceChanged(option.value))}
              style={{ flex: 1 }}
              testID={`theme-${option.value}`}
            />
          ))}
        </View>
      </Surface>

      <Surface gap="md">
        <Text variant="heading">{t('settings.language')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['system', ...SUPPORTED_LOCALES] as LanguagePreference[]).map((option) => (
            <Button
              key={option}
              label={LANGUAGE_NAMES[option]}
              variant={language === option ? 'primary' : 'secondary'}
              onPress={() => dispatch(languagePreferenceChanged(option))}
              testID={`language-${option}`}
            />
          ))}
        </View>
      </Surface>

      <Button
        label={t('settings.signOut')}
        variant="danger"
        testID="sign-out"
        onPress={() => {
          dispatch(signedOut());
          showToast({ message: t('auth.signedOut'), tone: 'info' });
        }}
      />
    </Screen>
  );
}
