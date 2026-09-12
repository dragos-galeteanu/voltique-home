import { screen } from '@testing-library/react-native';

import type { Alert } from '@/api/generated/endpoints';
import { renderWithProviders } from '@/test/render-with-providers';

import { AlertRow } from './alert-row';

const alert: Alert = {
  id: 'a1',
  householdId: 'h1',
  assetId: 'asset-1',
  assetName: 'Roof array',
  code: 'inverter_grid_voltage',
  severity: 'critical',
  status: 'open',
  title: 'Inverter stopped exporting',
  detail: 'Grid voltage has been out of range since 07:41.',
  derivedFrom: 'deviceLog',
  firstSeenAt: '2026-09-12T07:41:12Z',
  lastSeenAt: new Date().toISOString(),
  occurrences: 47,
};

describe('AlertRow', () => {
  it('leads with the problem, the asset and how often it happened', async () => {
    await renderWithProviders(<AlertRow alert={alert} onPress={jest.fn()} />);

    expect(screen.getByText('Inverter stopped exporting')).toBeOnTheScreen();
    expect(screen.getByText('Roof array')).toBeOnTheScreen();
    expect(screen.getByText('47 occurrences')).toBeOnTheScreen();
  });

  it('shows both the severity and the lifecycle state', async () => {
    await renderWithProviders(<AlertRow alert={alert} onPress={jest.fn()} />);

    expect(screen.getByText('Critical')).toBeOnTheScreen();
    expect(screen.getByText('Open')).toBeOnTheScreen();
  });

  it('says one occurrence, not one occurrences', async () => {
    await renderWithProviders(
      <AlertRow alert={{ ...alert, occurrences: 1 }} onPress={jest.fn()} />,
    );

    expect(screen.getByText('1 occurrence')).toBeOnTheScreen();
  });

  it('reads as one labelled control for assistive technology', async () => {
    await renderWithProviders(<AlertRow alert={alert} onPress={jest.fn()} />);

    expect(screen.getByLabelText('Inverter stopped exporting, Critical, Open')).toBeOnTheScreen();
  });

  it('marks a resolved alert as resolved', async () => {
    await renderWithProviders(
      <AlertRow alert={{ ...alert, status: 'resolved' }} onPress={jest.fn()} />,
    );

    expect(screen.getByText('Resolved')).toBeOnTheScreen();
  });
});
