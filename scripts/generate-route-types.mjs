#!/usr/bin/env node
/**
 * Writes .expo/types/router.d.ts, which is what makes route paths type-checked.
 *
 * Only the dev server generates that file, and it is not committed, so a CI typecheck
 * would otherwise accept any string as an href. This starts the server, waits for the
 * file, and stops it again.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const TYPES_FILE = '.expo/types/router.d.ts';
const TIMEOUT_MS = 120_000;
const PORT = process.env.EXPO_TYPEGEN_PORT ?? '8099';

rmSync(TYPES_FILE, { force: true });

const server = spawn('npx', ['expo', 'start', '--port', PORT], {
  env: { ...process.env, CI: '1', APP_VARIANT: process.env.APP_VARIANT ?? 'development' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', (chunk) => (output += chunk));
server.stderr.on('data', (chunk) => (output += chunk));

const startedAt = Date.now();
let generated = false;

while (Date.now() - startedAt < TIMEOUT_MS) {
  if (existsSync(TYPES_FILE) && statSync(TYPES_FILE).size > 0) {
    generated = true;
    break;
  }
  if (server.exitCode !== null) break;
  await sleep(250);
}

server.kill('SIGTERM');
await sleep(500);
if (server.exitCode === null) server.kill('SIGKILL');

if (!generated) {
  console.error('Could not generate route types. Dev server output:\n' + output.slice(-2000));
  process.exit(1);
}

const routes = [...readFileSync(TYPES_FILE, 'utf8').matchAll(/`(\/[a-z0-9/_-]*)`/g)]
  .map((match) => match[1])
  .filter((route, index, all) => all.indexOf(route) === index)
  .sort();

console.log(`Generated ${TYPES_FILE} with ${routes.length} routes:`);
routes.forEach((route) => console.log(`  ${route}`));
process.exit(0);
