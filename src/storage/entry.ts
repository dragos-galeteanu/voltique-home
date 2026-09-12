import type { z } from 'zod';

/**
 * Where a value lives and who it belongs to.
 *
 * `device` outlives the account: how the screen looks, what has been dismissed. `person`
 * belongs to whoever is signed in and is wiped when they sign out, so a handset passed to
 * someone else keeps nothing about the last user.
 */
export type StorageScope = 'device' | 'person';

/** The keychain is for secrets. Everything else is plain, readable storage. */
export type StorageBackend = 'async' | 'secure';

export type StorageEntry<T> = {
  /** Storage key. Namespaced so an unrelated library cannot collide with it. */
  key: string;
  backend: StorageBackend;
  scope: StorageScope;
  /** Bumped when the shape changes. A stored value of any other version is discarded. */
  version: number;
  schema: z.ZodType<T>;
  /** Returned when nothing is stored, or when what is stored no longer fits. */
  fallback: T;
};

export function defineEntry<T>(entry: StorageEntry<T>): StorageEntry<T> {
  return entry;
}

/** What actually goes to disk: the value, stamped with the version that wrote it. */
export type StorageEnvelope<T> = { v: number; value: T };
