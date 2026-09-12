import { z } from 'zod';

import { defineEntry, type StorageEntry } from './entry';

/**
 * Everything this app stores on the device, in one place.
 *
 * If it is not listed here, the app does not keep it. That is the point of the file: a
 * privacy question has a single, readable answer, and adding a key is a visible change.
 */

const NAMESPACE = 'voltique';
const key = (name: string) => `${NAMESPACE}.${name}`;

// --- session ----------------------------------------------------------------
const authTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

const authUser = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: z.enum(['consumer', 'installer']),
});

export const sessionEntry = defineEntry({
  key: key('session'),
  backend: 'secure',
  scope: 'person',
  version: 1,
  schema: z.object({ user: authUser, tokens: authTokens }).nullable(),
  fallback: null,
});

// --- how the app looks, which belongs to the handset ------------------------
export const appearanceEntry = defineEntry({
  key: key('appearance'),
  backend: 'async',
  scope: 'device',
  version: 1,
  schema: z.object({
    themePreference: z.enum(['system', 'light', 'dark']),
    languagePreference: z.enum(['system', 'en', 'de', 'fr', 'it', 'es']),
  }),
  fallback: { themePreference: 'system' as const, languagePreference: 'system' as const },
});

// --- what has been shown once and need not be shown again -------------------
export const promptsEntry = defineEntry({
  key: key('prompts'),
  backend: 'async',
  scope: 'device',
  version: 1,
  schema: z.object({
    notificationPromptDismissed: z.boolean(),
  }),
  fallback: { notificationPromptDismissed: false },
});

// --- where you left off -----------------------------------------------------
export const viewStateEntry = defineEntry({
  key: key('viewState'),
  backend: 'async',
  scope: 'person',
  version: 1,
  schema: z.object({
    dashboardRange: z.enum(['day', 'week', 'month']),
    alertFilter: z.enum(['open', 'acknowledged', 'resolved', 'all']),
    selectedHouseholdId: z.string().nullable(),
  }),
  fallback: {
    dashboardRange: 'day' as const,
    alertFilter: 'open' as const,
    selectedHouseholdId: null,
  },
});

// --- the only behavioural trail, and the only thing behind consent ----------
const recentItem = z.object({
  kind: z.enum(['asset', 'household']),
  id: z.string(),
  name: z.string(),
  at: z.string(),
});

export const recentlyViewedEntry = defineEntry({
  key: key('recentlyViewed'),
  backend: 'async',
  scope: 'person',
  version: 1,
  schema: z.object({
    /** Off until someone turns it on. Nothing is recorded while this is false. */
    enabled: z.boolean(),
    items: z.array(recentItem),
  }),
  fallback: { enabled: false, items: [] },
});

// --- the offline read cache, which is data rather than preference -----------
export const cacheEntry = defineEntry({
  key: key('cache'),
  backend: 'async',
  scope: 'person',
  version: 2,
  schema: z.object({ savedAt: z.string(), api: z.unknown() }).nullable(),
  fallback: null,
});

// --- development only -------------------------------------------------------
export const devEntry = defineEntry({
  key: key('dev'),
  backend: 'async',
  scope: 'device',
  version: 1,
  schema: z.object({ mockScenario: z.string().nullable() }),
  fallback: { mockScenario: null },
});

export const STORAGE_ENTRIES: StorageEntry<never>[] = [
  sessionEntry,
  appearanceEntry,
  promptsEntry,
  viewStateEntry,
  recentlyViewedEntry,
  cacheEntry,
  devEntry,
] as unknown as StorageEntry<never>[];
