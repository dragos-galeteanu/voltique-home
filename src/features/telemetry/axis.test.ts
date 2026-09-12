import { buildAxisLabeller, formatWindowLabel } from './axis';

const BUCHAREST = 'Europe/Bucharest';
const noonUtc = Date.UTC(2026, 6, 15, 9, 0); // 12:00 in Bucharest

describe('buildAxisLabeller', () => {
  it('labels a day in local clock time, not UTC', () => {
    expect(buildAxisLabeller('day', BUCHAREST, 'en')(noonUtc)).toBe('12:00');
  });

  it('labels a week by weekday, in the reader language', () => {
    expect(buildAxisLabeller('week', BUCHAREST, 'en')(noonUtc)).toBe('Wed');
    expect(buildAxisLabeller('week', BUCHAREST, 'de')(noonUtc)).toBe('Mi');
  });

  it('labels a month by date', () => {
    expect(buildAxisLabeller('month', BUCHAREST, 'en')(noonUtc)).toBe('15');
  });

  it('returns nothing for a value that is not a time', () => {
    expect(buildAxisLabeller('day', BUCHAREST, 'en')(Number.NaN)).toBe('');
  });
});

describe('formatWindowLabel', () => {
  const from = new Date(noonUtc).toISOString();

  it('names the day, the week start and the month', () => {
    expect(formatWindowLabel('day', from, BUCHAREST, 'en')).toContain('Wednesday');
    expect(formatWindowLabel('month', from, BUCHAREST, 'en')).toBe('July 2026');
  });

  it('follows the reader language', () => {
    expect(formatWindowLabel('month', from, BUCHAREST, 'de')).toBe('Juli 2026');
    expect(formatWindowLabel('month', from, BUCHAREST, 'fr')).toBe('juillet 2026');
  });
});
