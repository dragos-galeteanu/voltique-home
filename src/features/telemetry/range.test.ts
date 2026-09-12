import { buildWindow } from './range';

const BUCHAREST = 'Europe/Bucharest';
const hours = (window: { from: string; to: string }) =>
  (Date.parse(window.to) - Date.parse(window.from)) / 3_600_000;

describe('buildWindow', () => {
  it('starts the day at local midnight, not UTC midnight', () => {
    // 14:30 local on a summer day, when Bucharest is three hours ahead of UTC.
    const window = buildWindow('day', BUCHAREST, new Date('2026-07-15T11:30:00Z'));

    expect(window.from).toBe('2026-07-14T21:00:00.000Z');
    expect(window.to).toBe('2026-07-15T21:00:00.000Z');
    expect(window.resolution).toBe('quarterHour');
  });

  it('asks for the finest buckets over a day and the coarsest over a month', () => {
    const now = new Date('2026-07-15T11:30:00Z');

    expect(buildWindow('day', BUCHAREST, now).resolution).toBe('quarterHour');
    expect(buildWindow('week', BUCHAREST, now).resolution).toBe('hour');
    expect(buildWindow('month', BUCHAREST, now).resolution).toBe('day');
  });

  it('covers 23 hours on the day the clocks go forward', () => {
    // European summer time begins on 29 March 2026.
    const window = buildWindow('day', BUCHAREST, new Date('2026-03-29T10:00:00Z'));

    expect(hours(window)).toBe(23);
  });

  it('covers 25 hours on the day the clocks go back', () => {
    // European summer time ends on 25 October 2026.
    const window = buildWindow('day', BUCHAREST, new Date('2026-10-25T10:00:00Z'));

    expect(hours(window)).toBe(25);
  });

  it('starts the week on Monday', () => {
    // 15 July 2026 is a Wednesday.
    const window = buildWindow('week', BUCHAREST, new Date('2026-07-15T11:30:00Z'));

    expect(window.from).toBe('2026-07-12T21:00:00.000Z');
    expect(hours(window)).toBe(24 * 7);
  });

  it('treats Sunday as the last day of the week, not the first', () => {
    // 19 July 2026 is a Sunday; its week still starts on the 13th.
    const window = buildWindow('week', BUCHAREST, new Date('2026-07-19T11:30:00Z'));

    expect(window.from).toBe('2026-07-12T21:00:00.000Z');
  });

  it('covers a whole calendar month whatever its length', () => {
    const february = buildWindow('month', BUCHAREST, new Date('2026-02-10T12:00:00Z'));
    const july = buildWindow('month', BUCHAREST, new Date('2026-07-10T12:00:00Z'));

    expect(hours(february)).toBe(24 * 28);
    expect(hours(july)).toBe(24 * 31);
  });

  it('rolls December over into the next January', () => {
    const window = buildWindow('month', BUCHAREST, new Date('2026-12-20T12:00:00Z'));

    expect(window.from).toBe('2026-11-30T22:00:00.000Z');
    expect(window.to).toBe('2026-12-31T22:00:00.000Z');
  });

  it('follows the household timezone, not the device', () => {
    const now = new Date('2026-07-15T11:30:00Z');

    expect(buildWindow('day', 'Pacific/Auckland', now).from).toBe('2026-07-14T12:00:00.000Z');
    expect(buildWindow('day', 'America/Los_Angeles', now).from).toBe('2026-07-15T07:00:00.000Z');
  });
});
