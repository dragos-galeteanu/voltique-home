import { formatEnergy, formatPercent, formatPower, formatRelativeTime } from './format-energy';

describe('formatPower', () => {
  it('keeps small values in watts', () => {
    expect(formatPower(940)).toBe('940 W');
  });

  it('switches to kilowatts at a thousand', () => {
    expect(formatPower(1000)).toBe('1.00 kW');
    expect(formatPower(4210)).toBe('4.21 kW');
  });

  it('handles export as a negative value', () => {
    expect(formatPower(-1200)).toBe('-1.20 kW');
  });

  it('shows a dash rather than zero when there is no reading', () => {
    expect(formatPower(null)).toBe('—');
    expect(formatPower(undefined)).toBe('—');
  });

  it('does not confuse zero with missing', () => {
    expect(formatPower(0)).toBe('0 W');
  });
});

describe('formatEnergy', () => {
  it('converts watt-hours to kilowatt-hours', () => {
    expect(formatEnergy(18400)).toBe('18.4 kWh');
  });

  it('keeps small values in watt-hours', () => {
    expect(formatEnergy(300)).toBe('300 Wh');
  });

  it('reaches megawatt-hours', () => {
    expect(formatEnergy(2_500_000)).toBe('2.50 MWh');
  });
});

describe('formatPercent', () => {
  it('rounds to whole percent', () => {
    expect(formatPercent(62.4)).toBe('62%');
  });

  it('distinguishes empty from unknown', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(null)).toBe('—');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-09-12T09:00:00Z');

  it('reads as just now under a minute', () => {
    expect(formatRelativeTime('2026-09-12T08:59:30Z', now)).toBe('just now');
  });

  it('counts minutes, then hours, then days', () => {
    expect(formatRelativeTime('2026-09-12T08:20:00Z', now)).toBe('40 min ago');
    expect(formatRelativeTime('2026-09-12T04:00:00Z', now)).toBe('5 h ago');
    expect(formatRelativeTime('2026-09-09T09:00:00Z', now)).toBe('3 d ago');
  });

  it('says never when an asset has not reported', () => {
    expect(formatRelativeTime(null, now)).toBe('never');
    expect(formatRelativeTime(undefined, now)).toBe('never');
  });

  it('does not crash on a malformed timestamp', () => {
    expect(formatRelativeTime('not a date', now)).toBe('unknown');
  });
});
