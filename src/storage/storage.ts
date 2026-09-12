import { backendFor } from './backends';
import type { StorageEntry, StorageEnvelope, StorageScope } from './entry';
import { STORAGE_ENTRIES } from './registry';

/**
 * Reading, writing and clearing. Every path goes through here, so a value can never be
 * written somewhere it was not declared to live.
 *
 * Nothing throws. A device with unreadable storage should run with defaults rather than
 * refuse to start, and a corrupt value is worth less than a working app.
 */

export async function read<T>(entry: StorageEntry<T>): Promise<T> {
  try {
    const raw = await backendFor(entry.backend).get(entry.key);
    if (!raw) return entry.fallback;

    const envelope = JSON.parse(raw) as Partial<StorageEnvelope<unknown>>;

    // Written by an older shape: discard rather than guess how to migrate it.
    if (envelope.v !== entry.version) return entry.fallback;

    const parsed = entry.schema.safeParse(envelope.value);
    return parsed.success ? parsed.data : entry.fallback;
  } catch {
    return entry.fallback;
  }
}

export async function write<T>(entry: StorageEntry<T>, value: T): Promise<void> {
  try {
    const envelope: StorageEnvelope<T> = { v: entry.version, value };
    await backendFor(entry.backend).set(entry.key, JSON.stringify(envelope));
  } catch {
    // Losing a write costs the next launch its remembered state, nothing more.
  }
}

export async function remove(entry: StorageEntry<unknown>): Promise<void> {
  try {
    await backendFor(entry.backend).remove(entry.key);
  } catch {
    // The next write replaces it anyway.
  }
}

export function entriesInScope(scope: StorageScope): StorageEntry<unknown>[] {
  return STORAGE_ENTRIES.filter((entry) => entry.scope === scope);
}

/**
 * Wipes a whole scope. Called with `person` on sign out, which is the one guarantee this
 * module exists to make.
 */
export async function clearScope(scope: StorageScope): Promise<void> {
  await Promise.all(entriesInScope(scope).map((entry) => remove(entry)));
}
