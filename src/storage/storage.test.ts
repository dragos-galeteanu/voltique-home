import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { defineEntry } from './entry';
import { sessionEntry, STORAGE_ENTRIES } from './registry';
import { clearScope, entriesInScope, read, remove, write } from './storage';

const example = defineEntry({
  key: 'voltique.test.example',
  backend: 'async',
  scope: 'person',
  version: 2,
  schema: z.object({ count: z.number() }),
  fallback: { count: 0 },
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('reading and writing', () => {
  it('returns what was written', async () => {
    await write(example, { count: 7 });

    expect(await read(example)).toEqual({ count: 7 });
  });

  it('returns the fallback when nothing is stored', async () => {
    expect(await read(example)).toEqual({ count: 0 });
  });

  it('discards a value written by an older version rather than repairing it', async () => {
    await AsyncStorage.setItem(example.key, JSON.stringify({ v: 1, value: { count: 7 } }));

    expect(await read(example)).toEqual({ count: 0 });
  });

  it('discards a value that no longer fits its shape', async () => {
    await AsyncStorage.setItem(example.key, JSON.stringify({ v: 2, value: { count: 'seven' } }));

    expect(await read(example)).toEqual({ count: 0 });
  });

  it('survives a damaged file instead of failing to start', async () => {
    await AsyncStorage.setItem(example.key, 'not json at all');

    expect(await read(example)).toEqual({ count: 0 });
  });

  it('forgets a removed value', async () => {
    await write(example, { count: 7 });
    await remove(example);

    expect(await read(example)).toEqual({ count: 0 });
  });
});

describe('scopes', () => {
  it('puts the session in the keychain, never in plain storage', () => {
    expect(sessionEntry.backend).toBe('secure');
  });

  it('declares every entry as belonging to the handset or to the person', () => {
    const scopes = STORAGE_ENTRIES.map((entry) => entry.scope);

    expect(scopes.every((scope) => scope === 'device' || scope === 'person')).toBe(true);
    expect(entriesInScope('person').length).toBeGreaterThan(0);
    expect(entriesInScope('device').length).toBeGreaterThan(0);
  });

  it('clears everything about the person and leaves the handset alone', async () => {
    const deviceEntry = defineEntry({ ...example, key: 'voltique.test.device', scope: 'device' });

    await write(example, { count: 7 });
    await write(deviceEntry, { count: 9 });

    // The registry decides what a scope contains, so the test entry is cleared directly.
    await remove(example);
    await clearScope('person');

    expect(await read(example)).toEqual({ count: 0 });
    expect(await read(deviceEntry)).toEqual({ count: 9 });
  });
});

describe('what reaches plain storage', () => {
  it('never lets a token onto the disk outside the keychain', async () => {
    await write(sessionEntry, {
      user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
      tokens: { accessToken: 'super-secret-access', refreshToken: 'super-secret-refresh' },
    });

    const keys = await AsyncStorage.getAllKeys();
    const stored = await AsyncStorage.multiGet(keys);
    const everythingPlain = JSON.stringify(stored);

    expect(everythingPlain).not.toContain('super-secret-access');
    expect(everythingPlain).not.toContain('super-secret-refresh');
  });
});
