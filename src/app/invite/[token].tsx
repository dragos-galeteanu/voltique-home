import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAcceptInviteMutation } from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { LoadingState } from '@/components/states';
import { Button, Screen, Surface, Text } from '@/design-system';
import { selectAuthStatus, selectRole } from '@/features/auth/auth-slice';
import { ROLE_HOME } from '@/features/auth/role-gate';
import { householdSelected } from '@/features/household/household-slice';
import { pendingInviteCleared, pendingInviteStored } from '@/features/invites/invite-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

/**
 * Where an invitation link lands, for either role.
 *
 * Opened while signed out, the token is kept and the person is sent to sign in; the
 * entry route brings them back here afterwards, so a link is never lost.
 */
export default function AcceptInviteScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { token } = useLocalSearchParams<{ token: string }>();
  const status = useAppSelector(selectAuthStatus);
  const role = useAppSelector(selectRole);

  const [acceptInvite, { isLoading }] = useAcceptInviteMutation();
  const [error, setError] = useState<unknown>(null);
  const [acceptedName, setAcceptedName] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'restoring' || !token) return;

    if (status === 'signedOut') {
      dispatch(pendingInviteStored(token));
      router.replace('/sign-in');
      return;
    }

    let cancelled = false;

    void acceptInvite({ token })
      .unwrap()
      .then((household) => {
        if (cancelled) return;
        dispatch(pendingInviteCleared());
        dispatch(householdSelected(household.id));
        setAcceptedName(household.name);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        dispatch(pendingInviteCleared());
        setError(reason);
      });

    return () => {
      cancelled = true;
    };
  }, [acceptInvite, dispatch, router, status, token]);

  if (status === 'restoring' || isLoading) {
    return (
      <Screen testID="accept-invite">
        <LoadingState testID="invite-loading" />
      </Screen>
    );
  }

  return (
    <Screen testID="accept-invite">
      <View style={{ gap: 4, marginTop: 32 }}>
        <Text variant="display">{t('invite.title')}</Text>
      </View>

      <Surface gap="lg">
        {acceptedName ? (
          <>
            <Text testID="invite-accepted">{t('invite.accepted', { name: acceptedName })}</Text>
            <Button
              label={t('invite.continue')}
              testID="invite-continue"
              onPress={() => router.replace(role ? ROLE_HOME[role] : '/')}
            />
          </>
        ) : (
          <>
            <Text tone="danger" testID="invite-failed">
              {getErrorMessage(error, t('invite.failed'))}
            </Text>
            <Button
              label={t('common.back')}
              variant="secondary"
              onPress={() => router.replace(role ? ROLE_HOME[role] : '/')}
            />
          </>
        )}
      </Surface>
    </Screen>
  );
}
