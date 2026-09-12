import { sessionEntry } from '@/storage/registry';
import { read, remove, write } from '@/storage/storage';

import type { AuthSession } from './types';

/**
 * Session persistence. The entry declares the keychain, so this cannot accidentally end
 * up in plain storage, and a corrupt or outdated record reads back as no session rather
 * than throwing at startup.
 */
export async function readStoredSession(): Promise<AuthSession | null> {
  return (await read(sessionEntry)) as AuthSession | null;
}

export async function writeStoredSession(session: AuthSession): Promise<void> {
  await write(sessionEntry, session);
}

export async function clearStoredSession(): Promise<void> {
  await remove(sessionEntry);
}
