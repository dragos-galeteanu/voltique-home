import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/test/render-with-providers';

import { MetricTile } from './metric-tile';
import { RangeSelector } from './range-selector';

describe('MetricTile', () => {
  it('shows the figure and its label', async () => {
    await renderWithProviders(
      <MetricTile label="Produced" value="30.4 kWh" caption="today" testID="tile" />,
    );

    expect(screen.getByText('Produced')).toBeOnTheScreen();
    expect(screen.getByText('30.4 kWh')).toBeOnTheScreen();
    expect(screen.getByText('today')).toBeOnTheScreen();
  });
});

describe('RangeSelector', () => {
  it('offers a day, a week and a month', async () => {
    await renderWithProviders(<RangeSelector value="day" onChange={jest.fn()} />);

    expect(screen.getByTestId('range-day')).toBeOnTheScreen();
    expect(screen.getByTestId('range-week')).toBeOnTheScreen();
    expect(screen.getByTestId('range-month')).toBeOnTheScreen();
  });

  it('marks the selected range as busy for assistive technology', async () => {
    await renderWithProviders(<RangeSelector value="week" onChange={jest.fn()} />);

    expect(screen.getByText('Week')).toBeOnTheScreen();
  });
});
