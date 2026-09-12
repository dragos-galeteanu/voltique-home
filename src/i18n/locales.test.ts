import { resolveDeviceLocale, resources, SUPPORTED_LOCALES } from './index';

type Catalogue = Record<string, unknown>;

/** Flattens to dotted paths so two catalogues can be compared key by key. */
function keyPaths(value: Catalogue, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child !== null && typeof child === 'object'
      ? keyPaths(child as Catalogue, path)
      : [path];
  });
}

const english = keyPaths(resources.en.translation as Catalogue).sort();

describe('translation catalogues', () => {
  it.each(SUPPORTED_LOCALES.filter((locale) => locale !== 'en'))(
    '%s has exactly the keys English has',
    (locale) => {
      const translated = keyPaths(resources[locale].translation as Catalogue).sort();

      const missing = english.filter((key) => !translated.includes(key));
      const extra = translated.filter((key) => !english.includes(key));

      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    },
  );

  it.each(SUPPORTED_LOCALES)('%s leaves no value empty', (locale) => {
    const catalogue = resources[locale].translation as Catalogue;
    const empty = keyPaths(catalogue).filter((path) => {
      const value = path
        .split('.')
        .reduce<unknown>((node, key) => (node as Catalogue)?.[key], catalogue);
      return typeof value !== 'string' || value.trim() === '';
    });

    expect(empty).toEqual([]);
  });

  it.each(SUPPORTED_LOCALES)('%s keeps every interpolation English uses', (locale) => {
    const catalogue = resources[locale].translation as Catalogue;

    const mismatched = english.filter((path) => {
      const read = (source: Catalogue) =>
        path.split('.').reduce<unknown>((node, key) => (node as Catalogue)?.[key], source);

      const placeholders = (value: unknown) =>
        typeof value === 'string' ? [...value.matchAll(/{{(\w+)}}/g)].map((m) => m[1]).sort() : [];

      const expected = placeholders(read(resources.en.translation as Catalogue));
      const actual = placeholders(read(catalogue));
      return expected.join() !== actual.join();
    });

    expect(mismatched).toEqual([]);
  });
});

describe('resolveDeviceLocale', () => {
  it('takes the first device language the app speaks', () => {
    expect(resolveDeviceLocale([{ languageCode: 'nl' }, { languageCode: 'de' }])).toBe('de');
  });

  it('ignores region, so Austrian German is still German', () => {
    expect(resolveDeviceLocale([{ languageCode: 'de' }])).toBe('de');
  });

  it('falls back to English when it speaks none of them', () => {
    expect(resolveDeviceLocale([{ languageCode: 'nl' }, { languageCode: null }])).toBe('en');
  });
});
