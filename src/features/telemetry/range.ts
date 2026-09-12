import type { Resolution } from '@/api/generated/endpoints';

/**
 * Time windows for the dashboard.
 *
 * Every boundary is computed in the household's timezone, because that is where the
 * server buckets daily and monthly totals. Doing it in the device's zone would put a
 * day's production in the wrong day for anyone travelling, and would quietly break
 * around a daylight-saving change.
 */
export type RangeKey = 'day' | 'week' | 'month';

export type TelemetryWindow = {
  /** Inclusive start, ISO 8601 in UTC. */
  from: string;
  /** Exclusive end, ISO 8601 in UTC. */
  to: string;
  resolution: Resolution;
};

export const RANGE_KEYS = ['day', 'week', 'month'] as const;

/** Bucket size per range, chosen so a chart has enough points to read but not thousands. */
const RESOLUTION_FOR_RANGE: Record<RangeKey, Resolution> = {
  day: 'quarterHour',
  week: 'hour',
  month: 'day',
};

type ZonedParts = { year: number; month: number; day: number; weekday: number };

function partsInZone(instant: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });

  const parts = formatter.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    weekday: Math.max(0, weekdays.indexOf(read('weekday'))),
  };
}

/** How far the zone is from UTC at that instant, including any daylight-saving shift. */
function offsetMs(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  const asIfUtc = Date.UTC(
    read('year'),
    read('month') - 1,
    read('day'),
    read('hour'),
    read('minute'),
    read('second'),
  );

  return asIfUtc - instant.getTime();
}

/**
 * The instant at which the given local wall-clock midnight happens.
 *
 * Resolved twice because the offset depends on the instant we are still deriving, and a
 * single pass lands an hour out on the two days a year the clocks move.
 */
function zonedMidnight(year: number, month: number, day: number, timeZone: string): Date {
  const wallClock = Date.UTC(year, month - 1, day);
  const firstGuess = new Date(wallClock - offsetMs(new Date(wallClock), timeZone));
  const corrected = new Date(wallClock - offsetMs(firstGuess, timeZone));
  return corrected;
}

function startOfDay(instant: Date, timeZone: string): Date {
  const { year, month, day } = partsInZone(instant, timeZone);
  return zonedMidnight(year, month, day, timeZone);
}

function addDays(instant: Date, days: number, timeZone: string): Date {
  const { year, month, day } = partsInZone(instant, timeZone);
  return zonedMidnight(year, month, day + days, timeZone);
}

/** Weeks start on Monday, which is the convention in every locale the app ships in. */
function startOfWeek(instant: Date, timeZone: string): Date {
  const { weekday } = partsInZone(instant, timeZone);
  const daysSinceMonday = (weekday + 6) % 7;
  return addDays(startOfDay(instant, timeZone), -daysSinceMonday, timeZone);
}

function startOfMonth(instant: Date, timeZone: string): Date {
  const { year, month } = partsInZone(instant, timeZone);
  return zonedMidnight(year, month, 1, timeZone);
}

function addMonths(instant: Date, months: number, timeZone: string): Date {
  const { year, month } = partsInZone(instant, timeZone);
  return zonedMidnight(year, month + months, 1, timeZone);
}

/** The window the dashboard should ask for, given a range and a household timezone. */
export function buildWindow(
  range: RangeKey,
  timeZone: string,
  now: Date = new Date(),
): TelemetryWindow {
  const resolution = RESOLUTION_FOR_RANGE[range];

  const [from, to] =
    range === 'day'
      ? [startOfDay(now, timeZone), addDays(startOfDay(now, timeZone), 1, timeZone)]
      : range === 'week'
        ? [startOfWeek(now, timeZone), addDays(startOfWeek(now, timeZone), 7, timeZone)]
        : [startOfMonth(now, timeZone), addMonths(startOfMonth(now, timeZone), 1, timeZone)];

  return { from: from.toISOString(), to: to.toISOString(), resolution };
}
