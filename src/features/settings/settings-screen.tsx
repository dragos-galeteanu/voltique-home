import { View } from 'react-native';

import { Button, Screen, Surface, Text, type ThemePreference, useToast } from '@/design-system';
import { selectCurrentUser, signedOut } from '@/features/auth/auth-slice';
import { selectThemePreference, themePreferenceChanged } from '@/features/ui/ui-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const PREFERENCES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * Shared by both roles. Account details come from the API in M3; appearance and sign
 * out are fully wired already.
 */
export function SettingsScreen() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const user = useAppSelector(selectCurrentUser);
  const preference = useAppSelector(selectThemePreference);

  return (
    <Screen scrollable testID="settings-screen">
      <Text variant="display">Settings</Text>

      <Surface gap="sm">
        <Text variant="label" tone="muted">
          Signed in as
        </Text>
        <Text variant="heading">{user?.displayName ?? 'Unknown'}</Text>
        <Text tone="secondary">{user?.email ?? ''}</Text>
        <Text variant="caption" tone="muted">
          Role: {user?.role ?? 'none'}
        </Text>
      </Surface>

      <Surface gap="md">
        <Text variant="heading">Appearance</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PREFERENCES.map((option) => (
            <Button
              key={option.value}
              label={option.label}
              variant={preference === option.value ? 'primary' : 'secondary'}
              onPress={() => dispatch(themePreferenceChanged(option.value))}
              style={{ flex: 1 }}
              testID={`theme-${option.value}`}
            />
          ))}
        </View>
      </Surface>

      <Button
        label="Sign out"
        variant="danger"
        testID="sign-out"
        onPress={() => {
          dispatch(signedOut());
          showToast({ message: 'Signed out', tone: 'info' });
        }}
      />
    </Screen>
  );
}
