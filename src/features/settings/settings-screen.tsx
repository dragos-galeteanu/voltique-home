import { skipToken } from '@reduxjs/toolkit/query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { AlertSeverity } from '@/api/generated/endpoints';
import {
  useListDevicesQuery,
  useUpdateDeviceNotificationsMutation,
} from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { Button, Screen, Surface, Text, type ThemePreference, useToast } from '@/design-system';
import { selectCurrentUser, signedOut } from '@/features/auth/auth-slice';
import { selectDeviceId, selectPushPermission } from '@/features/notifications/notification-slice';
import { useUnregisterDevice } from '@/features/notifications/use-push-registration';
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
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const user = useAppSelector(selectCurrentUser);
  const preference = useAppSelector(selectThemePreference);
  const language = useAppSelector(selectLanguagePreference);

  const pushPermission = useAppSelector(selectPushPermission);
  const deviceId = useAppSelector(selectDeviceId);
  const unregisterDevice = useUnregisterDevice();

  // The server holds the truth about what this handset is told, so it is read back
  // rather than mirrored locally.
  const devices = useListDevicesQuery(deviceId ? undefined : skipToken);
  const device = devices.data?.find((candidate) => candidate.id === deviceId);
  const [updateNotifications, { isLoading: updatingNotifications }] =
    useUpdateDeviceNotificationsMutation();

  async function changeNotifications(next: { enabled: boolean; minSeverity: AlertSeverity }) {
    if (!deviceId) return;

    try {
      await updateNotifications({ deviceId, notificationPreferences: next }).unwrap();
    } catch (error) {
      showToast({
        message: getErrorMessage(error, t('notifications.updateFailed')),
        tone: 'danger',
      });
    }
  }

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

      <Surface gap="md" testID="notification-settings">
        <Text variant="heading">{t('notifications.settingsTitle')}</Text>

        {pushPermission === 'denied' ? (
          <>
            <Text variant="label">{t('notifications.deniedTitle')}</Text>
            <Text tone="secondary">{t('notifications.deniedDescription')}</Text>
          </>
        ) : !device ? (
          <Text tone="secondary" testID="notifications-unregistered">
            {t('notifications.notRegistered')}
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label={t('notifications.enabled')}
                variant={device.notifications.enabled ? 'primary' : 'secondary'}
                loading={updatingNotifications}
                onPress={() =>
                  void changeNotifications({
                    enabled: !device.notifications.enabled,
                    minSeverity: device.notifications.minSeverity,
                  })
                }
                style={{ flex: 1 }}
                testID="notifications-toggle"
              />
            </View>

            <Text variant="label" tone="muted">
              {t('notifications.minSeverity')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['warning', 'critical'] as const).map((severity) => (
                <Button
                  key={severity}
                  label={
                    severity === 'warning'
                      ? t('notifications.severityWarning')
                      : t('notifications.severityCritical')
                  }
                  variant={device.notifications.minSeverity === severity ? 'primary' : 'secondary'}
                  onPress={() =>
                    void changeNotifications({
                      enabled: device.notifications.enabled,
                      minSeverity: severity,
                    })
                  }
                  style={{ flex: 1 }}
                  testID={`notifications-severity-${severity}`}
                />
              ))}
            </View>
          </>
        )}
      </Surface>

      {user?.role === 'consumer' ? (
        <Button
          label={t('settings.access')}
          variant="secondary"
          testID="settings-access"
          onPress={() => router.push('/consumer/access')}
        />
      ) : null}

      {__DEV__ ? (
        <Button
          label="Mock scenarios"
          variant="secondary"
          testID="settings-scenarios"
          onPress={() => router.push('/dev/scenarios')}
        />
      ) : null}

      <Button
        label={t('settings.signOut')}
        variant="danger"
        testID="sign-out"
        onPress={() => {
          // Detach the handset while the session still works, so a shared phone stops
          // receiving this person's faults.
          void unregisterDevice().finally(() => {
            dispatch(signedOut());
            showToast({ message: t('auth.signedOut'), tone: 'info' });
          });
        }}
      />
    </Screen>
  );
}
