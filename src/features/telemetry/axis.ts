import { currentLocale } from '@/i18n';

import type { RangeKey } from './range';

/**
 * Axis labels, in the household's timezone and the reader's language. A day shows
 * clock times, a week shows weekday names, a month shows dates.
 */
export function buildAxisLabeller(
  range: RangeKey,
  timeZone: string,
  locale = currentLocale(),
): (value: number) => string {
  const options: Intl.DateTimeFormatOptions =
    range === 'day'
      ? { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
      : range === 'week'
        ? { timeZone, weekday: 'short' }
        : { timeZone, day: 'numeric' };

  const formatter = new Intl.DateTimeFormat(locale, options);

  return (value: number) => (Number.isFinite(value) ? formatter.format(new Date(value)) : '');
}

/** The heading above the chart: which day, week or month is on screen. */
export function formatWindowLabel(
  range: RangeKey,
  fromIso: string,
  timeZone: string,
  locale = currentLocale(),
): string {
  const from = new Date(fromIso);

  if (range === 'month') {
    return new Intl.DateTimeFormat(locale, { timeZone, month: 'long', year: 'numeric' }).format(
      from,
    );
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    day: 'numeric',
    month: 'short',
    ...(range === 'day' ? { weekday: 'long' } : {}),
  }).format(from);
}
