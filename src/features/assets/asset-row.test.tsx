import { screen } from '@testing-library/react-native';

import type { Asset } from '@/api/generated/endpoints';
import { renderWithProviders } from '@/test/render-with-providers';

import { AssetRow } from './asset-row';

const asset: Asset = {
  id: 'a1',
  householdId: 'h1',
  name: 'Roof array',
  assetTypeId: 'solar_inverter',
  manufacturerId: 'sunra',
  modelId: 'sunra-x7',
  category: 'production',
  status: 'online',
  lastSeenAt: new Date().toISOString(),
  latestReading: { powerW: 4210, energyTodayWh: 18400 },
  createdAt: '2026-02-02T11:30:00Z',
};

describe('AssetRow', () => {
  it('shows the name, the status and both readings in human units', async () => {
    await renderWithProviders(<AssetRow asset={asset} onLongPress={jest.fn()} />);

    expect(screen.getByText('Roof array')).toBeOnTheScreen();
    expect(screen.getByText('Online')).toBeOnTheScreen();
    expect(screen.getByText('4.21 kW')).toBeOnTheScreen();
    expect(screen.getByText('18.4 kWh')).toBeOnTheScreen();
  });

  it('labels a faulted asset as faulted', async () => {
    await renderWithProviders(
      <AssetRow asset={{ ...asset, status: 'faulted' }} onLongPress={jest.fn()} />,
    );

    expect(screen.getByText('Faulted')).toBeOnTheScreen();
  });

  it('shows a dash rather than a zero when an asset has never reported', async () => {
    await renderWithProviders(
      <AssetRow
        asset={{ ...asset, latestReading: undefined, lastSeenAt: undefined }}
        onLongPress={jest.fn()}
      />,
    );

    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getByText('Last seen never')).toBeOnTheScreen();
  });

  it('is reachable by assistive technology as one labelled control', async () => {
    await renderWithProviders(<AssetRow asset={asset} onLongPress={jest.fn()} />);

    expect(screen.getByLabelText('Roof array, Online')).toBeOnTheScreen();
  });
});
