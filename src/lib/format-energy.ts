import { currentLocale, i18n, type SupportedLocale } from '@/i18n';

/** Tests pin a locale; the app leaves it out and follows the active language. */
type SupportedLocaleArg = SupportedLocale | undefined;

/**
 * The API speaks watts and watt-hours. People read kilowatts, in their own number
 * format. Conversion and formatting happen here and nowhere else, so a value can never
 * be shown in the wrong unit or with the wrong decimal separator.
 */

function number(value: number, decimals: number, locale = currentLocale()): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function missing(): string {
  return i18n.t('common.noValue');
}

/** 940 W stays watts; 4210 W becomes 4.21 kW, or 4,21 kW in German. */
export function formatPower(watts: number | null | undefined, locale?: SupportedLocaleArg): string {
  if (watts == null) return missing();

  const absolute = Math.abs(watts);
  if (absolute < 1000) return `${number(watts, 0, locale)} W`;
  if (absolute < 1_000_000) return `${number(watts / 1000, 2, locale)} kW`;
  return `${number(watts / 1_000_000, 2, locale)} MW`;
}

/** 18400 Wh becomes 18.4 kWh. */
export function formatEnergy(
  wattHours: number | null | undefined,
  locale?: SupportedLocaleArg,
): string {
  if (wattHours == null) return missing();

  const absolute = Math.abs(wattHours);
  if (absolute < 1000) return `${number(wattHours, 0, locale)} Wh`;
  if (absolute < 1_000_000) return `${number(wattHours / 1000, 1, locale)} kWh`;
  return `${number(wattHours / 1_000_000, 2, locale)} MWh`;
}

export function formatPercent(
  value: number | null | undefined,
  locale?: SupportedLocaleArg,
): string {
  return value == null ? missing() : `${number(value, 0, locale)}%`;
}

/** "4 min ago", in the active language. Absolute dates once it is old. */
export function formatRelativeTime(
  iso: string | null | undefined,
  now = Date.now(),
  locale?: SupportedLocaleArg,
): string {
  if (!iso) return i18n.t('common.never');

  const then = Date.parse(iso);
  if (Number.isNaN(then)) return i18n.t('common.unknown');

  const seconds = Math.round((now - then) / 1000);
  if (seconds < 60) return i18n.t('common.justNow');

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return i18n.t('common.minutesAgo', { count: minutes });

  const hours = Math.round(minutes / 60);
  if (hours < 24) return i18n.t('common.hoursAgo', { count: hours });

  const days = Math.round(hours / 24);
  if (days < 7) return i18n.t('common.daysAgo', { count: days });

  return new Intl.DateTimeFormat(locale ?? currentLocale(), { dateStyle: 'medium' }).format(then);
}
