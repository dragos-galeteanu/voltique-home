import { by, device, element, expect } from 'detox';

describe('Signing in', () => {
  beforeEach(async () => {
    // A fresh install each time, so a stored session cannot decide which shell opens.
    await device.launchApp({ delete: true, newInstance: true });
  });

  it('opens on the sign-in screen when there is no session', async () => {
    await expect(element(by.id('sign-in-screen'))).toBeVisible();
  });

  it('refuses an invalid email without calling the API', async () => {
    await element(by.id('sign-in-email')).typeText('not-an-email');
    await element(by.id('sign-in-password')).typeText('password1');
    await element(by.id('sign-in-submit')).tap();

    await expect(element(by.text('Enter a valid email address'))).toBeVisible();
    await expect(element(by.id('sign-in-screen'))).toBeVisible();
  });

  it('lands a consumer in the consumer shell', async () => {
    await element(by.id('sign-in-email')).typeText('ada@example.com');
    await element(by.id('sign-in-password')).typeText('password1');
    await element(by.id('sign-in-submit')).tap();

    await expect(element(by.id('tab-dashboard'))).toBeVisible();
    await expect(element(by.id('tab-assets'))).toBeVisible();
  });

  it('keeps the session across a restart', async () => {
    await element(by.id('sign-in-email')).typeText('ada@example.com');
    await element(by.id('sign-in-password')).typeText('password1');
    await element(by.id('sign-in-submit')).tap();
    await expect(element(by.id('tab-assets'))).toBeVisible();

    await device.launchApp({ newInstance: true });

    await expect(element(by.id('tab-assets'))).toBeVisible();
  });

  it('returns to sign in after signing out', async () => {
    await element(by.id('sign-in-email')).typeText('ada@example.com');
    await element(by.id('sign-in-password')).typeText('password1');
    await element(by.id('sign-in-submit')).tap();

    await element(by.id('tab-settings')).tap();
    await element(by.id('sign-out')).tap();

    await expect(element(by.id('sign-in-screen'))).toBeVisible();
  });
});
