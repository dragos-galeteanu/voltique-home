import type en from './locales/en.json';

/**
 * Makes translation keys type-checked against the English catalogue, so a renamed or
 * missing key is a compile error rather than a string that renders as itself.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
    returnNull: false;
  }
}
