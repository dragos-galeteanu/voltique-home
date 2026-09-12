/**
 * A tiny stand-in for the network, used by tests that exercise the API client.
 *
 * Routes are matched by method and path, ignoring the origin, and each responder can
 * inspect the request it received. Keeping this in the repo rather than reaching for a
 * mock server keeps the transform chain simple and makes call ordering easy to assert.
 */
export type MockRequest = {
  method: string;
  path: string;
  /** Header names are lower-cased. */
  headers: Record<string, string>;
  body: unknown;
};

export type MockResult = { status?: number; body?: unknown };
export type MockResponder = (request: MockRequest) => MockResult | Promise<MockResult>;

export type FetchMock = {
  /** Registers a responder, replacing any earlier one for the same route. */
  on: (method: string, path: string, responder: MockResponder) => void;
  /** Every request that reached the mock, in order. */
  requests: MockRequest[];
  /** How many times one route was called. */
  count: (method: string, path: string) => number;
  restore: () => void;
};

/**
 * RTK Query's fetchBaseQuery always calls fetch with a Request object, but a plain URL
 * and init is still valid usage, so both are handled.
 */
async function describeRequest(input: RequestInfo | URL, init?: RequestInit): Promise<MockRequest> {
  if (input instanceof Request) {
    const clone = input.clone();
    const text = await clone.text();
    return {
      method: input.method.toUpperCase(),
      path: new URL(input.url).pathname,
      headers: Object.fromEntries(input.headers.entries()),
      body: text ? JSON.parse(text) : undefined,
    };
  }

  const rawHeaders = init?.headers;
  const headers =
    rawHeaders instanceof Headers
      ? Object.fromEntries(rawHeaders.entries())
      : Array.isArray(rawHeaders)
        ? Object.fromEntries(rawHeaders)
        : { ...((rawHeaders ?? {}) as Record<string, string>) };

  return {
    method: (init?.method ?? 'GET').toUpperCase(),
    path: new URL(String(input)).pathname,
    headers: Object.fromEntries(
      Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]),
    ),
    body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
  };
}

export function installFetchMock(): FetchMock {
  const responders = new Map<string, MockResponder>();
  const requests: MockRequest[] = [];
  const original = globalThis.fetch;

  const key = (method: string, path: string) => `${method.toUpperCase()} ${path}`;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = await describeRequest(input, init);
    requests.push(request);

    const responder = responders.get(key(request.method, request.path));
    if (!responder) {
      throw new Error(`No mock registered for ${key(request.method, request.path)}`);
    }

    const { status = 200, body } = await responder(request);

    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  return {
    on: (method, path, responder) => responders.set(key(method, path), responder),
    requests,
    count: (method, path) =>
      requests.filter((request) => request.method === method.toUpperCase() && request.path === path)
        .length,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}
