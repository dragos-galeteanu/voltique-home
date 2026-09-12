import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteAccountMutation } from '@/api/generated/endpoints';
import { getErrorMessage, getProblem } from '@/api/problem';
import { Button, Sheet, Surface, Text, TextField, useToast } from '@/design-system';
import { signedOut } from '@/features/auth/auth-slice';
import { useUnregisterDevice } from '@/features/notifications/use-push-registration';
import { useAppDispatch } from '@/store/hooks';

/**
 * Deleting the account, which both app stores require to be possible from inside the app.
 *
 * The current password is asked for, because a phone left unlocked should not be able to
 * erase someone's account with two taps. What is deleted is spelled out before the button
 * rather than after it.
 */
export function DeleteAccount() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const unregisterDevice = useUnregisterDevice();
  const [deleteAccount, { isLoading, error, reset }] = useDeleteAccountMutation();

  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');

  function close() {
    setOpen(false);
    setPassword('');
    reset();
  }

  async function confirm() {
    try {
      await deleteAccount({ accountDeletionRequest: { password } }).unwrap();

      // Detach the handset while the token still works, then drop the session, which
      // clears everything stored about this person.
      await unregisterDevice();
      setOpen(false);
      setPassword('');
      dispatch(signedOut());
      showToast({ message: t('account.deleted'), tone: 'info' });
    } catch {
      // Kept open with the reason below, so the password can be corrected.
    }
  }

  const wrongPassword = getProblem(error)?.code === 'password_incorrect';

  return (
    <>
      <Surface gap="md" testID="delete-account">
        <Text variant="heading" tone="danger">
          {t('account.deleteTitle')}
        </Text>
        <Text tone="secondary">{t('account.deleteExplanation')}</Text>
        <Button
          label={t('account.deleteTitle')}
          variant="danger"
          onPress={() => setOpen(true)}
          testID="delete-account-open"
        />
      </Surface>

      <Sheet
        visible={open}
        onClose={close}
        title={t('account.deleteTitle')}
        testID="delete-account-sheet"
      >
        <Text tone="secondary">{t('account.deleteExplanation')}</Text>

        <TextField
          label={t('auth.password')}
          autoCapitalize="none"
          autoComplete="current-password"
          hint={t('account.deletePasswordPrompt')}
          onChangeText={setPassword}
          secureTextEntry
          testID="delete-account-password"
          value={password}
          error={
            error
              ? wrongPassword
                ? t('account.wrongPassword')
                : getErrorMessage(error, t('account.deleteFailed'))
              : undefined
          }
        />

        <Button
          label={t('account.deleteConfirm')}
          variant="danger"
          loading={isLoading}
          disabled={password.length === 0}
          onPress={() => void confirm()}
          testID="delete-account-confirm"
        />
        <Button label={t('common.cancel')} variant="ghost" onPress={close} />
      </Sheet>
    </>
  );
}
