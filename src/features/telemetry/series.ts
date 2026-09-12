import type { Resolution, TelemetryResponse, TelemetrySeries } from '@/api/generated/endpoints';

/**
 * Turns the API's per-metric series into the row-per-timestamp shape a chart wants, and
 * derives the figures shown above it.
 *
 * A null value means the server had no reading for that bucket. It is carried through as
 * null rather than zero, because a chart must draw a gap there: a solar array that was
 * unreachable at noon did not produce nothing, it is unknown.
 */
export type ChartRow = {
  /** Bucket start, epoch milliseconds. */
  t: number;
} & Record<string, number | null>;

export function mergeSeries(series: readonly TelemetrySeries[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();

  for (const entry of series) {
    for (const point of entry.points) {
      const t = Date.parse(point.t);
      if (Number.isNaN(t)) continue;

      const row = rows.get(t) ?? ({ t } as ChartRow);
      row[entry.metric] = point.value ?? null;
      rows.set(t, row);
    }
  }

  // A metric missing from a row entirely must still read as a gap, not as absent.
  const metrics = series.map((entry) => entry.metric);
  const ordered = [...rows.values()].sort((a, b) => a.t - b.t);

  for (const row of ordered) {
    for (const metric of metrics) {
      if (!(metric in row)) row[metric] = null;
    }
  }

  return ordered;
}

/** Nominal length of one bucket, used only to bound the last one. */
const RESOLUTION_MS: Record<Resolution, number> = {
  minute: 60_000,
  quarterHour: 15 * 60_000,
  hour: 60 * 60_000,
  day: 24 * 60 * 60_000,
  month: 31 * 24 * 60 * 60_000,
};

/**
 * Energy under a power curve, in watt-hours.
 *
 * Each bucket is weighted by its own duration, taken from the next bucket's start, so a
 * day with a daylight-saving change is still correct. The final bucket is bounded by its
 * resolution as well as by the window, so a stale or truncated series cannot stretch one
 * reading across days and invent energy nobody generated.
 *
 * Gaps contribute nothing rather than being interpolated, for the same reason.
 */
export function integrateEnergyWh(
  series: TelemetrySeries | undefined,
  resolution: Resolution,
  windowEndIso: string,
): number | null {
  if (!series || series.points.length === 0) return null;
  if (series.unit !== 'W') return null;

  const windowEnd = Date.parse(windowEndIso);
  let total = 0;
  let measured = false;

  series.points.forEach((point, index) => {
    if (point.value == null) return;

    const start = Date.parse(point.t);
    if (Number.isNaN(start) || start >= windowEnd) return;

    const next = series.points[index + 1];
    const nextStart = next ? Date.parse(next.t) : Number.NaN;
    const end = Math.min(
      Number.isNaN(nextStart) ? Number.POSITIVE_INFINITY : nextStart,
      start + RESOLUTION_MS[resolution],
      windowEnd,
    );
    if (end <= start) return;

    total += point.value * ((end - start) / 3_600_000);
    measured = true;
  });

  return measured ? total : null;
}

function findSeries(
  response: TelemetryResponse | undefined,
  metric: string,
): TelemetrySeries | undefined {
  return response?.series.find((entry) => entry.metric === metric);
}

export function latestValue(series: TelemetrySeries | undefined): number | null {
  if (!series) return null;

  for (let index = series.points.length - 1; index >= 0; index -= 1) {
    const value = series.points[index]?.value;
    if (value != null) return value;
  }
  return null;
}

export function peakValue(series: TelemetrySeries | undefined): number | null {
  if (!series) return null;

  const values = series.points
    .map((point) => point.value)
    .filter((value): value is number => value != null);

  return values.length > 0 ? Math.max(...values) : null;
}

export type HouseholdSummary = {
  productionWh: number | null;
  consumptionWh: number | null;
  peakProductionW: number | null;
  /**
   * Energy taken from the grid. State of charge is deliberately absent: the household
   * series carry battery power in watts, and the percentage belongs to the storage
   * asset, so the screen reads it from there instead of inventing it here.
   */
  gridImportWh: number | null;
};

/** The figures shown above the chart, all derived from the same response. */
export function summariseHousehold(
  response: TelemetryResponse | undefined,
  windowEndIso: string,
): HouseholdSummary {
  const resolution = response?.resolution ?? 'hour';

  return {
    productionWh: integrateEnergyWh(findSeries(response, 'production'), resolution, windowEndIso),
    consumptionWh: integrateEnergyWh(findSeries(response, 'consumption'), resolution, windowEndIso),
    peakProductionW: peakValue(findSeries(response, 'production')),
    gridImportWh: integrateEnergyWh(findSeries(response, 'gridImport'), resolution, windowEndIso),
  };
}
