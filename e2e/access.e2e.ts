import { by, device, element, expect, waitFor } from 'detox';

const PENDING_INVITE = 'invite-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const INSTALLER_MEMBER = 'member-8b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e';

async function signIn() {
  await element(by.id('sign-in-email')).typeText('ada@example.com');
  await element(by.id('sign-in-password')).typeText('password1');
  await element(by.id('sign-in-submit')).tap();
  await waitFor(element(by.id('tab-settings')))
    .toBeVisible()
    .withTimeout(10_000);
}

async function openAccess() {
  await element(by.id('tab-settings')).tap();
  await element(by.id('settings-access')).tap();
  await waitFor(element(by.id('access-screen')))
    .toBeVisible()
    .withTimeout(10_000);
}

describe('Household access', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      languageAndLocale: { language: 'en', locale: 'en-US' },
    });
    await signIn();
    await openAccess();
  });

  it('lists the people who can see the household, with their roles', async () => {
    await expect(element(by.id('access-members'))).toBeVisible();
    await expect(element(by.id(INSTALLER_MEMBER))).toBeVisible();
    await expect(element(by.text('Nadia at Voltfix'))).toBeVisible();
  });

  it('lists invitations that are still waiting', async () => {
    await expect(element(by.id('access-invites'))).toBeVisible();
    await expect(element(by.id(PENDING_INVITE))).toBeVisible();
  });

  it('explains what an installer will and will not see', async () => {
    await element(by.id('invite-role-installer')).tap();

    await expect(
      element(
        by.text(
          'An installer sees your assets, their logs and their faults. Not your household settings.',
        ),
      ),
    ).toBeVisible();
  });

  it('refuses an invitation without a valid address', async () => {
    await element(by.id('invite-email')).typeText('not-an-email');
    await element(by.id('send-invite')).tap();

    await expect(element(by.id('invite-email-error'))).toBeVisible();
  });

  it('sends an invitation', async () => {
    await element(by.id('invite-role-installer')).tap();
    await element(by.id('invite-email')).typeText('tom@voltfix.example');
    await element(by.id('send-invite')).tap();

    await waitFor(element(by.id('toast')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('revokes a pending invitation', async () => {
    await element(by.id(`revoke-${PENDING_INVITE}`)).tap();

    await waitFor(element(by.id('toast')))
      .toBeVisible()
      .withTimeout(10_000);
  });
});
