import { by, device, element, expect, waitFor } from 'detox';

async function launch() {
  await device.launchApp({
    delete: true,
    newInstance: true,
    languageAndLocale: { language: 'en', locale: 'en-US' },
  });
  await waitFor(element(by.id('sign-in-screen')))
    .toBeVisible()
    .withTimeout(10_000);
}

async function signIn() {
  await element(by.id('sign-in-email')).typeText('ada@example.com');
  await element(by.id('sign-in-password')).typeText('password1');
  await element(by.id('sign-in-submit')).tap();
  await waitFor(element(by.id('tab-settings')))
    .toBeVisible()
    .withTimeout(10_000);
}

describe('Creating an account', () => {
  beforeEach(launch);

  it('is reachable from sign in and back again', async () => {
    await element(by.id('go-to-sign-up')).tap();
    await waitFor(element(by.id('sign-up-screen')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('go-to-sign-in')).tap();
    await waitFor(element(by.id('sign-in-screen')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('refuses two passwords that do not match', async () => {
    await element(by.id('go-to-sign-up')).tap();
    await waitFor(element(by.id('sign-up-screen')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('sign-up-name')).typeText('Sam');
    await element(by.id('sign-up-email')).typeText('sam@example.com');
    await element(by.id('sign-up-password')).typeText('password1');
    await element(by.id('sign-up-confirm')).typeText('password2');
    await element(by.id('sign-up-submit')).tap();

    await expect(element(by.id('sign-up-confirm-error'))).toBeVisible();
    await expect(element(by.id('sign-up-screen'))).toBeVisible();
  });

  it('signs the new account straight in', async () => {
    await element(by.id('go-to-sign-up')).tap();
    await waitFor(element(by.id('sign-up-screen')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('sign-up-name')).typeText('Sam');
    await element(by.id('sign-up-email')).typeText('sam@example.com');
    await element(by.id('sign-up-password')).typeText('password1');
    await element(by.id('sign-up-confirm')).typeText('password1');
    await element(by.id('sign-up-submit')).tap();

    await waitFor(element(by.id('tab-dashboard')))
      .toBeVisible()
      .withTimeout(15_000);
  });
});

describe('Resetting a password', () => {
  beforeEach(launch);

  it('asks for an address and confirms without saying whether it exists', async () => {
    await element(by.id('go-to-forgot-password')).tap();
    await waitFor(element(by.id('forgot-password-screen')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('reset-email')).typeText('nobody@example.com');
    await element(by.id('reset-submit')).tap();

    await waitFor(element(by.id('reset-sent')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('will not send an invalid address', async () => {
    await element(by.id('go-to-forgot-password')).tap();
    await waitFor(element(by.id('forgot-password-screen')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('reset-email')).typeText('not-an-email');
    await element(by.id('reset-submit')).tap();

    await expect(element(by.id('reset-email-error'))).toBeVisible();
  });
});

describe('Deleting an account', () => {
  beforeEach(async () => {
    await launch();
    await signIn();
    await element(by.id('tab-settings')).tap();
  });

  it('explains what goes before asking for anything', async () => {
    await waitFor(element(by.id('delete-account')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('delete-account-open'))).toBeVisible();
  });

  it('requires the password, and keeps the session when it is wrong', async () => {
    await element(by.id('delete-account-open')).tap();
    await waitFor(element(by.id('delete-account-sheet')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('delete-account-password')).typeText('wrong-password');
    await element(by.id('delete-account-confirm')).tap();

    await waitFor(element(by.id('delete-account-password-error')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('settings-screen'))).toBeVisible();
  });

  it('returns to sign in once the account is gone', async () => {
    await element(by.id('delete-account-open')).tap();
    await waitFor(element(by.id('delete-account-sheet')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('delete-account-password')).typeText('password1');
    await element(by.id('delete-account-confirm')).tap();

    await waitFor(element(by.id('sign-in-screen')))
      .toBeVisible()
      .withTimeout(15_000);
  });
});
