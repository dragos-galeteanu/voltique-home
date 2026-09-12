import { by, device, element, expect, waitFor } from 'detox';

const ROOF_ARRAY = 'asset-row-22222222-2222-4222-8222-222222222222';

async function signIn() {
  await element(by.id('sign-in-email')).typeText('ada@example.com');
  await element(by.id('sign-in-password')).typeText('password1');
  await element(by.id('sign-in-submit')).tap();
  await waitFor(element(by.id('tab-dashboard')))
    .toBeVisible()
    .withTimeout(10_000);
}

describe('Dashboard', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      languageAndLocale: { language: 'en', locale: 'en-US' },
    });
    await signIn();
    await element(by.id('tab-dashboard')).tap();
  });

  it('draws the chart and the headline figures', async () => {
    await waitFor(element(by.id('energy-chart')))
      .toBeVisible()
      .withTimeout(15_000);

    await expect(element(by.id('window-label'))).toBeVisible();
    await expect(element(by.id('tile-produced'))).toBeVisible();
    await expect(element(by.id('tile-consumed'))).toBeVisible();
    await expect(element(by.id('tile-peak'))).toBeVisible();
    await expect(element(by.id('tile-grid'))).toBeVisible();
  });

  it('switches between a day, a week and a month', async () => {
    await waitFor(element(by.id('energy-chart')))
      .toBeVisible()
      .withTimeout(15_000);

    await element(by.id('range-week')).tap();
    await waitFor(element(by.id('energy-chart')))
      .toBeVisible()
      .withTimeout(15_000);

    await element(by.id('range-month')).tap();
    await waitFor(element(by.id('energy-chart')))
      .toBeVisible()
      .withTimeout(15_000);

    await element(by.id('range-day')).tap();
    await expect(element(by.id('window-label'))).toBeVisible();
  });

  it('shows the battery tile when the household has storage', async () => {
    await waitFor(element(by.id('tile-battery')))
      .toBeVisible()
      .withTimeout(15_000);
  });

  it('opens an asset from the list and comes back', async () => {
    await element(by.id('tab-assets')).tap();
    await waitFor(element(by.id(ROOF_ARRAY)))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id(ROOF_ARRAY)).tap();

    await waitFor(element(by.id('asset-detail')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('asset-detail-status'))).toBeVisible();
    await waitFor(element(by.id('asset-power-chart')))
      .toBeVisible()
      .withTimeout(15_000);
    await expect(element(by.id('asset-recent-events'))).toBeVisible();

    // Uses the app's own control rather than a hardware gesture, which keeps the
    // assertion identical on both platforms.
    await element(by.id('asset-detail-back')).tap();
    await waitFor(element(by.id('consumer-assets')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('charts state of charge for an asset that reports it', async () => {
    await element(by.id('tab-assets')).tap();
    await waitFor(element(by.id(ROOF_ARRAY)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(ROOF_ARRAY)).tap();

    await waitFor(element(by.id('asset-charge-chart')))
      .toBeVisible()
      .withTimeout(15_000);
  });
});
