import type { TelemetryResponse, TelemetrySeries } from '@/api/generated/endpoints';

import { integrateEnergyWh, mergeSeries, peakValue, summariseHousehold } from './series';

const hourly = (metric: string, values: (number | null)[]): TelemetrySeries => ({
  metric,
  unit: 'W',
  points: values.map((value, index) => ({
    t: new Date(Date.UTC(2026, 8, 12, index)).toISOString(),
    value,
  })),
});

describe('mergeSeries', () => {
  it('lines metrics up on their timestamps', () => {
    const rows = mergeSeries([hourly('production', [0, 500]), hourly('consumption', [400, 380])]);

    expect(rows).toEqual([
      { t: Date.UTC(2026, 8, 12, 0), production: 0, consumption: 400 },
      { t: Date.UTC(2026, 8, 12, 1), production: 500, consumption: 380 },
    ]);
  });

  it('sorts rows by time even when the series are not aligned', () => {
    const late: TelemetrySeries = {
      metric: 'consumption',
      unit: 'W',
      points: [{ t: new Date(Date.UTC(2026, 8, 12, 5)).toISOString(), value: 900 }],
    };

    const rows = mergeSeries([late, hourly('production', [0, 500])]);

    expect(rows.map((row) => row.t)).toEqual([
      Date.UTC(2026, 8, 12, 0),
      Date.UTC(2026, 8, 12, 1),
      Date.UTC(2026, 8, 12, 5),
    ]);
  });

  it('keeps a gap as null so the chart can break the line', () => {
    const rows = mergeSeries([hourly('production', [100, null, 300])]);

    expect(rows[1]?.production).toBeNull();
  });

  it('marks a metric absent from a bucket as a gap rather than dropping it', () => {
    const rows = mergeSeries([hourly('production', [100, 200]), hourly('consumption', [400])]);

    expect(rows[1]).toEqual({ t: Date.UTC(2026, 8, 12, 1), production: 200, consumption: null });
  });
});

describe('integrateEnergyWh', () => {
  it('weights each bucket by its own duration', () => {
    // Three hourly buckets at 1000 W, with the window closing an hour after the last.
    const energy = integrateEnergyWh(
      hourly('production', [1000, 1000, 1000]),
      'hour',
      new Date(Date.UTC(2026, 8, 12, 3)).toISOString(),
    );

    expect(energy).toBe(3000);
  });

  it('does not let the final bucket outlast its own resolution', () => {
    const energy = integrateEnergyWh(
      hourly('production', [1000]),
      'hour',
      new Date(Date.UTC(2026, 8, 12, 2)).toISOString(),
    );

    expect(energy).toBe(1000);
  });

  it('counts a gap as nothing rather than inventing energy across it', () => {
    const energy = integrateEnergyWh(
      hourly('production', [1000, null, 1000]),
      'hour',
      new Date(Date.UTC(2026, 8, 12, 3)).toISOString(),
    );

    expect(energy).toBe(2000);
  });

  it('ignores buckets that start after the window closes', () => {
    const energy = integrateEnergyWh(
      hourly('production', [1000, 1000, 1000]),
      'hour',
      new Date(Date.UTC(2026, 8, 12, 1)).toISOString(),
    );

    expect(energy).toBe(1000);
  });

  it('refuses to stretch one stale reading across days', () => {
    const energy = integrateEnergyWh(
      hourly('production', [1000]),
      'hour',
      new Date(Date.UTC(2026, 8, 20)).toISOString(),
    );

    expect(energy).toBe(1000);
  });

  it('returns null when nothing at all was measured', () => {
    const energy = integrateEnergyWh(
      hourly('production', [null, null]),
      'hour',
      new Date(Date.UTC(2026, 8, 12, 2)).toISOString(),
    );

    expect(energy).toBeNull();
  });

  it('refuses to integrate a series that is not power', () => {
    const percent: TelemetrySeries = {
      metric: 'stateOfCharge',
      unit: 'percent',
      points: [{ t: new Date(Date.UTC(2026, 8, 12, 0)).toISOString(), value: 60 }],
    };

    expect(
      integrateEnergyWh(percent, 'hour', new Date(Date.UTC(2026, 8, 12, 1)).toISOString()),
    ).toBeNull();
  });
});

describe('peakValue', () => {
  it('ignores gaps when finding the maximum', () => {
    expect(peakValue(hourly('production', [100, null, 4200, 300]))).toBe(4200);
  });

  it('is null when every bucket is a gap', () => {
    expect(peakValue(hourly('production', [null, null]))).toBeNull();
  });
});

describe('summariseHousehold', () => {
  const response: TelemetryResponse = {
    from: new Date(Date.UTC(2026, 8, 12, 0)).toISOString(),
    to: new Date(Date.UTC(2026, 8, 12, 3)).toISOString(),
    resolution: 'hour',
    series: [hourly('production', [0, 1000, 2000]), hourly('consumption', [400, 400, 400])],
  };

  it('reads the state of charge from nowhere, since the household series has none', () => {
    const summary = summariseHousehold(response, response.to);
    expect('batteryPercent' in summary).toBe(false);
  });

  it('derives every headline figure from one response', () => {
    expect(summariseHousehold(response, response.to)).toEqual({
      productionWh: 3000,
      consumptionWh: 1200,
      peakProductionW: 2000,
      gridImportWh: null,
    });
  });

  it('survives having no data at all', () => {
    expect(summariseHousehold(undefined, response.to)).toEqual({
      productionWh: null,
      consumptionWh: null,
      peakProductionW: null,
      gridImportWh: null,
    });
  });
});
