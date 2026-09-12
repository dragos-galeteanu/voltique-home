#!/usr/bin/env node
/**
 * Runs the mock API without Docker, for machines and CI runners that have no Docker
 * daemon (GitHub's macOS runners, for one).
 *
 * Same shape as the container stack: Prism serves the contract on an internal port, and
 * a small proxy in front of it restores the /api/v1 prefix that Prism ignores.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const PUBLIC_PORT = Number(process.env.MOCK_PORT ?? 4010);
const PRISM_PORT = PUBLIC_PORT + 1;
const PREFIX = '/api/v1';

const prism = spawn(
  'npx',
  [
    '--yes',
    '@stoplight/prism-cli@5',
    'mock',
    'src/contract/openapi.yaml',
    '--host',
    '127.0.0.1',
    '--port',
    String(PRISM_PORT),
    '--multiprocess',
    'false',
  ],
  { stdio: ['ignore', 'inherit', 'inherit'] },
);

const proxy = http.createServer((request, response) => {
  if (request.url === '/health') {
    // Reports healthy only once Prism itself answers, so a caller waiting on this can
    // trust that the next request will be served rather than refused.
    const probe = http.request(
      { host: '127.0.0.1', port: PRISM_PORT, method: 'GET', path: '/users/me' },
      () => {
        response.writeHead(200, { 'content-type': 'text/plain' });
        response.end('ok');
      },
    );
    probe.on('error', () => {
      response.writeHead(503, { 'content-type': 'text/plain' });
      response.end('starting');
    });
    probe.end();
    return;
  }

  if (!request.url?.startsWith(PREFIX)) {
    response.writeHead(404, { 'content-type': 'application/problem+json' });
    response.end(JSON.stringify({ title: 'Not found', status: 404 }));
    return;
  }

  const upstream = http.request(
    {
      host: '127.0.0.1',
      port: PRISM_PORT,
      method: request.method,
      path: request.url.slice(PREFIX.length) || '/',
      headers: { ...request.headers, host: `127.0.0.1:${PRISM_PORT}` },
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );

  upstream.on('error', () => {
    response.writeHead(502, { 'content-type': 'application/problem+json' });
    response.end(JSON.stringify({ title: 'Mock upstream unavailable', status: 502 }));
  });

  request.pipe(upstream);
});

proxy.listen(PUBLIC_PORT, () => {
  console.log(`Mock API on http://localhost:${PUBLIC_PORT}${PREFIX}`);
});

function shutdown() {
  proxy.close();
  prism.kill('SIGTERM');
  void sleep(500).then(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
prism.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Prism exited with code ${code}`);
    proxy.close();
    process.exit(code);
  }
});
