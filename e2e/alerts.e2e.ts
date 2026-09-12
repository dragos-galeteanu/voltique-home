import { by, device, element, expect, waitFor } from 'detox';

/** Ids come from the contract examples, which the mock serves unchanged. */
const CRITICAL_ALERT = 'alert-row-33333333-3333-4333-8333-333333333333';

async function signIn() {
  await element(by.id('sign-in-email')).typeText('ada@example.com');
  await element(by.id('sign-in-password')).typeText('password1');
  await element(by.id('sign-in-submit')).tap();
  await waitFor(element(by.id('tab-alerts')))
    .toBeVisible()
    .withTimeout(10_000);
}

describe('Alerts', () => {
  beforeEach(async () => {
    await device.launchApp({
      delete: true,
      newInstance: true,
      languageAndLocale: { language: 'en', locale: 'en-US' },
    });
    await signIn();
    await element(by.id('tab-alerts')).tap();
  });

  it('lists the household faults worst first', async () => {
    await waitFor(element(by.id(CRITICAL_ALERT)))
      .toBeVisible()
      .withTimeout(10_000);

    await expect(element(by.text('Inverter stopped exporting'))).toBeVisible();
    await expect(element(by.id('alert-filters'))).toBeVisible();
  });

  it('filters by lifecycle state', async () => {
    await waitFor(element(by.id('alert-filters')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('alert-filter-resolved')).tap();
    await element(by.id('alert-filter-all')).tap();

    await waitFor(element(by.id(CRITICAL_ALERT)))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('opens an alert and shows what it was derived from', async () => {
    await waitFor(element(by.id(CRITICAL_ALERT)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(CRITICAL_ALERT)).tap();

    await waitFor(element(by.id('alert-detail')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.text('Device log'))).toBeVisible();
    await expect(element(by.id('alert-evidence'))).toBeVisible();
  });

  it('acknowledges an alert', async () => {
    await waitFor(element(by.id(CRITICAL_ALERT)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(CRITICAL_ALERT)).tap();
    await waitFor(element(by.id('alert-acknowledge')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('alert-acknowledge')).tap();

    await waitFor(element(by.text('Acknowledged')))
      .toBeVisible()
      .withTimeout(10_000);
  });

  it('reaches the full device log from an alert', async () => {
    await waitFor(element(by.id(CRITICAL_ALERT)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(CRITICAL_ALERT)).tap();
    await waitFor(element(by.id('alert-view-logs')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('alert-view-logs')).tap();

    await waitFor(element(by.id('asset-logs')))
      .toBeVisible()
      .withTimeout(10_000);
    await expect(element(by.id('log-severity-filters'))).toBeVisible();
    await expect(element(by.id('log-row-log_01J8'))).toBeVisible();
  });

  it('filters the device log by minimum severity', async () => {
    await waitFor(element(by.id(CRITICAL_ALERT)))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id(CRITICAL_ALERT)).tap();
    await waitFor(element(by.id('alert-view-logs')))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id('alert-view-logs')).tap();
    await waitFor(element(by.id('asset-logs')))
      .toBeVisible()
      .withTimeout(10_000);

    await element(by.id('log-severity-error')).tap();

    await waitFor(element(by.id('log-row-log_01J8')))
      .toBeVisible()
      .withTimeout(10_000);
  });
});
