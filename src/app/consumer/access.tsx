import { zodResolver } from '@hookform/resolvers/zod';
import { skipToken } from '@reduxjs/toolkit/query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import type { MembershipRole } from '@/api/generated/endpoints';
import {
  useCreateHouseholdInviteMutation,
  useListHouseholdInvitesQuery,
  useListHouseholdMembersQuery,
  useRemoveHouseholdMemberMutation,
  useRevokeInviteMutation,
} from '@/api/generated/endpoints';
import { getErrorMessage } from '@/api/problem';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import {
  Button,
  Screen,
  Sheet,
  StatusPill,
  Surface,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@/design-system';
import { useSelectedHousehold } from '@/features/household/use-selected-household';
import { formatRelativeTime } from '@/lib/format-energy';

/** Only these two can be invited. An owner is made by creating a household, not invited. */
const INVITABLE_ROLES = ['resident', 'installer'] as const satisfies readonly MembershipRole[];

function buildSchema(t: (key: 'access.emailRequired') => string) {
  return z.object({ email: z.email(t('access.emailRequired')) });
}

type InviteValues = z.infer<ReturnType<typeof buildSchema>>;

/**
 * Who can see this household. Residents share it; installers get the scoped view of
 * assets, logs and alerts that the server allows them.
 */
export default function AccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const { household } = useSelectedHousehold();
  const householdId = household?.id;

  const members = useListHouseholdMembersQuery(householdId ? { householdId } : skipToken);
  const invites = useListHouseholdInvitesQuery(
    householdId ? { householdId, status: 'pending' } : skipToken,
  );

  const [createInvite, { isLoading: inviting }] = useCreateHouseholdInviteMutation();
  const [revokeInvite] = useRevokeInviteMutation();
  const [removeMember] = useRemoveHouseholdMemberMutation();

  const [role, setRole] = useState<MembershipRole>('installer');
  const [pendingRemoval, setPendingRemoval] = useState<{ userId: string; name: string } | null>(
    null,
  );

  const schema = useMemo(() => buildSchema(t), [t]);
  const { control, handleSubmit, reset } = useForm<InviteValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const canManage = household?.membershipRole === 'owner';

  async function onInvite(values: InviteValues) {
    if (!householdId) return;

    try {
      await createInvite({
        householdId,
        inviteCreate: { email: values.email, membershipRole: role },
      }).unwrap();
      reset();
      showToast({ message: t('access.invited', { email: values.email }), tone: 'success' });
    } catch (error) {
      showToast({ message: getErrorMessage(error, t('access.inviteFailed')), tone: 'danger' });
    }
  }

  async function onRevoke(inviteId: string) {
    try {
      await revokeInvite({ inviteId }).unwrap();
      showToast({ message: t('access.revoked'), tone: 'info' });
    } catch (error) {
      showToast({ message: getErrorMessage(error, t('access.revokeFailed')), tone: 'danger' });
    }
  }

  async function onRemoveMember() {
    if (!householdId || !pendingRemoval) return;
    const { userId, name } = pendingRemoval;
    setPendingRemoval(null);

    try {
      await removeMember({ householdId, userId }).unwrap();
      showToast({ message: t('access.removed', { name }), tone: 'info' });
    } catch (error) {
      showToast({ message: getErrorMessage(error, t('access.removeFailed')), tone: 'danger' });
    }
  }

  if (!household) {
    return (
      <Screen testID="access-screen">
        <EmptyState
          title={t('household.emptyTitle')}
          description={t('household.emptyDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="access-screen">
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <Text variant="display">{t('access.title')}</Text>
          <Text tone="secondary">{household.name}</Text>
        </View>

        <Surface gap="md" testID="access-members">
          <Text variant="heading">{t('access.people')}</Text>

          {members.isLoading ? (
            <LoadingState />
          ) : members.error ? (
            <ErrorState error={members.error} onRetry={() => void members.refetch()} />
          ) : (
            (members.data?.data ?? []).map((member) => (
              <View
                key={member.userId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                }}
                testID={`member-${member.userId}`}
              >
                <View style={{ gap: 2, flexShrink: 1 }}>
                  <Text variant="heading">{member.displayName}</Text>
                  <Text variant="caption" tone="muted">
                    {member.email}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                  <StatusPill
                    label={t(`access.role.${member.membershipRole}`)}
                    tone={member.membershipRole === 'installer' ? 'info' : 'neutral'}
                  />
                  {canManage && member.membershipRole !== 'owner' ? (
                    <Button
                      label={t('common.remove')}
                      variant="ghost"
                      onPress={() =>
                        setPendingRemoval({ userId: member.userId, name: member.displayName })
                      }
                      testID={`remove-member-${member.userId}`}
                    />
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Surface>

        <Surface gap="md" testID="access-invites">
          <Text variant="heading">{t('access.pending')}</Text>

          {invites.isLoading ? (
            <LoadingState />
          ) : invites.error ? (
            <ErrorState error={invites.error} onRetry={() => void invites.refetch()} />
          ) : (invites.data?.data ?? []).length === 0 ? (
            <Text tone="secondary">{t('access.noPending')}</Text>
          ) : (
            (invites.data?.data ?? []).map((invite) => (
              <View
                key={invite.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: theme.spacing.md,
                }}
                testID={`invite-${invite.id}`}
              >
                <View style={{ gap: 2, flexShrink: 1 }}>
                  <Text>{invite.email}</Text>
                  <Text variant="caption" tone="muted">
                    {t('access.expires', { time: formatRelativeTime(invite.expiresAt) })}
                  </Text>
                </View>
                {canManage ? (
                  <Button
                    label={t('access.revoke')}
                    variant="ghost"
                    onPress={() => void onRevoke(invite.id)}
                    testID={`revoke-invite-${invite.id}`}
                  />
                ) : null}
              </View>
            ))
          )}
        </Surface>

        {canManage ? (
          <Surface gap="lg" testID="access-invite-form">
            <Text variant="heading">{t('access.inviteSomeone')}</Text>

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              {INVITABLE_ROLES.map((option) => (
                <Button
                  key={option}
                  label={t(`access.role.${option}`)}
                  variant={role === option ? 'primary' : 'secondary'}
                  onPress={() => setRole(option)}
                  style={{ flex: 1 }}
                  testID={`invite-role-${option}`}
                />
              ))}
            </View>

            <Text variant="caption" tone="muted">
              {role === 'installer' ? t('access.installerNote') : t('access.residentNote')}
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label={t('auth.email')}
                  autoCapitalize="none"
                  inputMode="email"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder={t('auth.emailPlaceholder')}
                  testID="invite-email"
                  value={field.value}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Button
              label={t('access.sendInvite')}
              loading={inviting}
              onPress={() => void handleSubmit(onInvite)()}
              testID="send-invite"
            />
          </Surface>
        ) : null}

        <Button label={t('common.back')} variant="ghost" onPress={() => router.back()} />
      </ScrollView>

      <Sheet
        visible={pendingRemoval !== null}
        onClose={() => setPendingRemoval(null)}
        title={t('access.removeTitle', { name: pendingRemoval?.name ?? '' })}
        testID="remove-member-sheet"
      >
        <Text tone="secondary">{t('access.removeExplanation')}</Text>
        <Button
          label={t('common.remove')}
          variant="danger"
          onPress={() => void onRemoveMember()}
          testID="confirm-remove-member"
        />
        <Button
          label={t('common.cancel')}
          variant="ghost"
          onPress={() => setPendingRemoval(null)}
        />
      </Sheet>
    </Screen>
  );
}
