import { by, device, element, expect, waitFor } from 'detox';

const HOUSEHOLD = 'installer-household-11111111-1111-4111-8111-111111111111';

/** The mock always signs in as a consumer, so the installer shell is reached in dev. */
async function signInAsInstaller() {
  await element(by.id('sign-in-as-installer')).tap();
  await waitFor(element(by.id('tab-households')))
    .toBeVisible()
    .withTimeout(10_000);
}

describe('Installer', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      languageAndLocale: { language: 'en', locale: 'en-US' },
    });
    await signInAsInstaller();
  });

  it('opens on the households that invited them', async () => {
    await waitFor(element(by.id(HOUSEHOLD)))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.text('Maple Street'))).toBeVisible();
  });

  it('has no consumer tabs', async () => {
    await expect(element(by.id('tab-dashboard'))).not.toExist();
    await expect(element(by.id('tab-assets'))).not.toExist();
  });

  it('shows a household with its faults and its assets', async () => {
    await waitFor(element(by.id(HOUSEHOLD)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(HOUSEHOLD)).tap();

    await waitFor(element(by.id('installer-household')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('installer-household-alerts'))).toBeVisible();
    await expect(element(by.id('installer-household-assets'))).toBeVisible();
  });

  it('reaches an asset log from a household', async () => {
    await waitFor(element(by.id(HOUSEHOLD)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(HOUSEHOLD)).tap();
    await waitFor(element(by.id('installer-household-assets')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('installer-asset-22222222-2222-4222-8222-222222222222')).tap();

    await waitFor(element(by.id('asset-logs')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('log-row-log_01J8'))).toBeVisible();
  });

  it('lists faults across every household, naming each one', async () => {
    await element(by.id('tab-alerts')).tap();

    await waitFor(element(by.id('installer-alerts')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.text('Inverter stopped exporting'))).toBeVisible();
    await expect(element(by.text('Heat pump has not reported'))).toBeVisible();
  });

  it('cannot manage who has access', async () => {
    await element(by.id('tab-settings')).tap();

    await waitFor(element(by.id('settings-screen')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('settings-access'))).not.toExist();
  });
});
