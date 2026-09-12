import { useTranslation } from 'react-i18next';

import { Button, Surface, Text } from '@/design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  promptDismissed as promptDismissedAction,
  selectPromptDismissed,
  selectPushPermission,
} from './notification-slice';
import { useRequestPushPermission } from './use-push-registration';

/**
 * Asks for notification permission where it makes sense: on the alerts screen, where the
 * person is already looking at faults, rather than on first launch where the request has
 * no context and is usually refused.
 *
 * Shows nothing once permission is settled either way, or once it has been waved off.
 */
export function PermissionPrompt() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const permission = useAppSelector(selectPushPermission);
  const dismissed = useAppSelector(selectPromptDismissed);
  const requestPermission = useRequestPushPermission();

  if (dismissed || permission !== 'undetermined') return null;

  return (
    <Surface gap="md" testID="notification-prompt">
      <Text variant="heading">{t('notifications.promptTitle')}</Text>
      <Text tone="secondary">{t('notifications.promptDescription')}</Text>
      <Button
        label={t('notifications.promptAllow')}
        onPress={() => void requestPermission()}
        testID="notification-prompt-allow"
      />
      <Button
        label={t('notifications.promptLater')}
        variant="ghost"
        onPress={() => dispatch(promptDismissedAction())}
        testID="notification-prompt-later"
      />
    </Surface>
  );
}
