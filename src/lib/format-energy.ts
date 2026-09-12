/**
 * The API speaks watts and watt-hours. People read kilowatts. Conversion happens here
 * and nowhere else, so a value can never be shown in the wrong unit.
 */

function round(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/** 940 W stays watts; 4210 W becomes 4.21 kW. */
export function formatPower(watts: number | null | undefined): string {
  if (watts == null) return '—';
  const absolute = Math.abs(watts);
  if (absolute < 1000) return `${round(watts, 0)} W`;
  if (absolute < 1_000_000) return `${round(watts / 1000, 2)} kW`;
  return `${round(watts / 1_000_000, 2)} MW`;
}

/** 18400 Wh becomes 18.4 kWh. */
export function formatEnergy(wattHours: number | null | undefined): string {
  if (wattHours == null) return '—';
  const absolute = Math.abs(wattHours);
  if (absolute < 1000) return `${round(wattHours, 0)} Wh`;
  if (absolute < 1_000_000) return `${round(wattHours / 1000, 1)} kWh`;
  return `${round(wattHours / 1_000_000, 2)} MWh`;
}

export function formatPercent(value: number | null | undefined): string {
  return value == null ? '—' : `${round(value, 0)}%`;
}

/** "4 minutes ago", for last-seen timestamps. Absolute dates once it is old. */
export function formatRelativeTime(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'never';

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return 'unknown';

  const seconds = Math.round((now - then) / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;

  return new Date(then).toLocaleDateString();
}
