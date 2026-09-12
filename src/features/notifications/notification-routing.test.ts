import { routeForNotification } from './notification-routing';

describe('routeForNotification', () => {
  it('sends a consumer to the alert, where they can acknowledge it', () => {
    expect(routeForNotification({ alertId: 'alert-1', assetId: 'asset-1' }, 'consumer')).toBe(
      '/consumer/alert/alert-1',
    );
  });

  it('falls back to the asset when a consumer notification names no alert', () => {
    expect(routeForNotification({ assetId: 'asset-1' }, 'consumer')).toBe(
      '/consumer/asset/asset-1',
    );
  });

  it('sends an installer to the device log, which is what they need', () => {
    expect(routeForNotification({ alertId: 'alert-1', assetId: 'asset-1' }, 'installer')).toBe(
      '/logs/asset-1',
    );
  });

  it('sends an installer to the household when no asset is named', () => {
    expect(routeForNotification({ householdId: 'house-1' }, 'installer')).toBe(
      '/installer/household/house-1',
    );
  });

  it('opens nothing rather than guessing', () => {
    expect(routeForNotification({}, 'consumer')).toBeNull();
    expect(routeForNotification(null, 'consumer')).toBeNull();
    expect(routeForNotification({ alertId: 'alert-1' }, null)).toBeNull();
  });

  it('ignores values that are not usable identifiers', () => {
    expect(routeForNotification({ alertId: 42 }, 'consumer')).toBeNull();
    expect(routeForNotification({ alertId: '' }, 'consumer')).toBeNull();
    expect(routeForNotification({ assetId: { id: 'x' } }, 'installer')).toBeNull();
  });
});
