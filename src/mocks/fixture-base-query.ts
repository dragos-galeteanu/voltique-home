import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { API_PATH_PREFIX } from '@/config/env';

import { fixtureBodies, fixtureRoutes } from './generated/fixtures';
import { handlers, type MockRequest, type MockResponse } from './handlers';
import { scenarioById, type ScenarioId } from './scenarios';
import type { World } from './world';

/**
 * An API client backed by the contract's examples instead of a server.
 *
 * It answers the same URLs the real client calls, so every screen keeps its real
 * behaviour: loading, refetching, cache invalidation, optimistic updates and their
 * rollback. Only the transport is different.
 */

let world: World | null = null;
let activeScenario: ScenarioId | null = null;

function copy<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}

/** Starts a scenario from scratch. Called when the dev picker changes it. */
export function startScenario(id: ScenarioId): void {
  activeScenario = id;
  world = scenarioById(id).build();
}

export function currentScenario(): ScenarioId | null {
  return activeScenario;
}

function matchRoute(method: string, path: string) {
  const withoutPrefix = path.startsWith(API_PATH_PREFIX)
    ? path.slice(API_PATH_PREFIX.length)
    : path;

  for (const route of fixtureRoutes) {
    if (route.method !== method) continue;

    const match = new RegExp(route.pattern).exec(withoutPrefix);
    if (!match) continue;

    const params = Object.fromEntries(
      route.params.map((name, index) => [name, decodeURIComponent(match[index + 1] ?? '')]),
    );
    return { route, params };
  }

  return null;
}

function respond(operationId: string, request: MockRequest, state: World): MockResponse {
  const handler = handlers[operationId];
  if (handler) return handler(state, request);

  // No handler means the answer does not depend on state: the contract example stands.
  const body = fixtureBodies[operationId];
  return body === undefined ? { status: 204 } : { status: 200, body };
}

export const fixtureBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  if (!world) startScenario('populated');
  const state = world!;

  const url = typeof args === 'string' ? args : args.url;
  const method = (typeof args === 'string' ? 'GET' : (args.method ?? 'GET')).toUpperCase();
  const [path = '', search = ''] = url.split('?');

  // The generated client passes query values separately rather than in the URL, so both
  // sources are merged before a handler sees them.
  const query = new URLSearchParams(search);
  if (typeof args !== 'string' && args.params) {
    for (const [name, value] of Object.entries(args.params)) {
      if (value !== undefined && value !== null) query.set(name, String(value));
    }
  }

  if (state.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, state.latencyMs));
  }

  if (state.failWith) {
    return {
      error: {
        status: state.failWith,
        data: {
          title: 'Service unavailable',
          status: state.failWith,
          code: 'upstream_unavailable',
        },
      } as FetchBaseQueryError,
    };
  }

  const matched = matchRoute(method, path);
  if (!matched) {
    return {
      error: {
        status: 404,
        data: {
          title: 'No fixture for this request',
          status: 404,
          code: 'fixture_missing',
          detail: `${method} ${path}`,
        },
      } as FetchBaseQueryError,
    };
  }

  const body =
    typeof args === 'string' || args.body === undefined
      ? undefined
      : (args.body as Record<string, unknown>);

  const request: MockRequest = { params: matched.params, query, body };
  const result = respond(matched.route.operationId, request, state);

  if (result.status >= 400) {
    return { error: { status: result.status, data: copy(result.body) } as FetchBaseQueryError };
  }

  // A copy, always. Redux freezes whatever ends up in the store, and handing out a
  // reference into the world would freeze the world itself: later writes would then fail
  // silently, and the mock would look like it had lost them.
  return { data: copy(result.body) ?? null };
};
