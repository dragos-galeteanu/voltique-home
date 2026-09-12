import { by, device, element, expect, waitFor } from 'detox';

/** The asset ids come from the examples in the contract, which the mock serves. */
const ROOF_ARRAY = 'asset-row-22222222-2222-4222-8222-222222222222';

async function signIn() {
  await element(by.id('sign-in-email')).typeText('ada@example.com');
  await element(by.id('sign-in-password')).typeText('password1');
  await element(by.id('sign-in-submit')).tap();
  await waitFor(element(by.id('tab-assets')))
    .toBeVisible()
    .withTimeout(10_000);
}

describe('Assets', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      languageAndLocale: { language: 'en', locale: 'en-US' },
    });
    await signIn();
    await element(by.id('tab-assets')).tap();
  });

  it('lists the household assets with their status', async () => {
    await waitFor(element(by.id(ROOF_ARRAY)))
      .toBeVisible()
      .withTimeout(10_000);

    await expect(element(by.text('Roof array'))).toBeVisible();
    await expect(element(by.text('Garage charger'))).toBeVisible();
    await expect(element(by.text('4.21 kW'))).toBeVisible();
  });

  it('names the household it is showing and can switch', async () => {
    await element(by.id('household-switcher')).tap();

    await expect(element(by.id('household-sheet'))).toBeVisible();
    await expect(element(by.text('Maple Street'))).toBeVisible();
  });

  it('adds an asset through the catalogue', async () => {
    await element(by.id('add-asset')).tap();
    await expect(element(by.id('add-asset-screen'))).toBeVisible();

    await element(by.id('asset-type-solar_inverter')).tap();
    await element(by.id('manufacturer-sunra')).tap();
    await element(by.id('model-sunra-x7')).tap();

    // The form is built from the model's declared parameters, not hardcoded here.
    await element(by.id('asset-name')).replaceText('Garden array');
    await element(by.id('asset-credential-serialNumber')).typeText('ABCD1234');
    await element(by.id('asset-credential-cloudPin')).typeText('9999');
    await element(by.id('submit-asset')).tap();

    await waitFor(element(by.id('consumer-assets')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('will not submit the connect form without the required credentials', async () => {
    await element(by.id('add-asset')).tap();
    await element(by.id('asset-type-solar_inverter')).tap();
    await element(by.id('manufacturer-sunra')).tap();
    await element(by.id('model-sunra-x7')).tap();

    await element(by.id('submit-asset')).tap();

    await expect(element(by.id('asset-credential-serialNumber-error'))).toBeVisible();
    await expect(element(by.id('add-asset-screen'))).toBeVisible();
  });

  it('confirms before removing an asset', async () => {
    await waitFor(element(by.id(ROOF_ARRAY)))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id(ROOF_ARRAY)).longPress();
    await expect(element(by.id('remove-asset-sheet'))).toBeVisible();

    await element(by.id('confirm-remove-asset')).tap();
    await waitFor(element(by.id(ROOF_ARRAY)))
      .not.toBeVisible()
      .withTimeout(10_000);
  });
});
