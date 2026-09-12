import * as Localization from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';

export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'es'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const FALLBACK_LOCALE: SupportedLocale = 'en';

/** English is the source catalogue; every other locale is translated from it. */
export const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  it: { translation: it },
  es: { translation: es },
} as const;

function isSupported(code: string | null | undefined): code is SupportedLocale {
  return SUPPORTED_LOCALES.includes(code as SupportedLocale);
}

/**
 * Picks the first device language we actually speak. Region is ignored, so de-AT and
 * de-DE both get German, which is the right call until the copy differs by region.
 */
export function resolveDeviceLocale(
  preferred: readonly { languageCode: string | null }[] = Localization.getLocales(),
): SupportedLocale {
  for (const locale of preferred) {
    if (isSupported(locale.languageCode)) return locale.languageCode;
  }
  return FALLBACK_LOCALE;
}

void i18next.use(initReactI18next).init({
  resources,
  lng: resolveDeviceLocale(),
  fallbackLng: FALLBACK_LOCALE,
  // React already escapes what it renders.
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** The locale in use, for Intl formatting of numbers, dates and units. */
export function currentLocale(): SupportedLocale {
  return isSupported(i18next.resolvedLanguage) ? i18next.resolvedLanguage : FALLBACK_LOCALE;
}

export async function changeLocale(locale: SupportedLocale): Promise<void> {
  await i18next.changeLanguage(locale);
}

export { default as i18n } from 'i18next';
