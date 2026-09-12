# API and contract

[`src/contract/openapi.yaml`](../src/contract/openapi.yaml) is the source of truth. It
describes every resource under `/api/v1`, the error bodies, cursor pagination and the units
every measurement carries. Three things are generated from it, and nothing in the app is
allowed to restate them.

## Changing the API

```bash
# 1. edit src/contract/openapi.yaml
npm run contract:lint   # validate it
npm run codegen         # regenerate the typed client and its hooks
npm run fixtures        # regenerate the mock fixtures
npm run verify
```

`npm run codegen` writes `src/api/generated/endpoints.ts`: one typed endpoint per
operation, plus a hook. The output is committed, so a fresh checkout builds without running
codegen and a contract change arrives as a reviewable diff. CI fails if the committed
output does not match the contract.

Never hand-edit generated files. Behaviour the generator cannot infer, such as an optimistic
update, is layered on with `enhanceEndpoints` in a feature folder, which is why regenerating
is always safe.

## Conventions the contract follows

- Bodies are camelCase on the wire, so nothing sits between the API and the store.
- Collections page by cursor and return `data` with a `nextCursor`. Telemetry is the
  exception: it is bounded by a time range and returns whole series.
- Errors are RFC 9457 problem details with a stable machine-readable `code`. The app maps
  the code to copy and to retry behaviour, never the status alone.
- Power is watts, energy is watt-hours, timestamps are ISO 8601 in UTC.
- The tag names in the contract match the `tagTypes` on the API slice, which is what lets
  cache invalidation be derived rather than hand-written.

## Resources

| Path                                                                 | Purpose                                                |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| `/auth/sessions`, `/auth/sessions/refresh`, `/auth/sessions/current` | Sign in, refresh, sign out                             |
| `/users/me`                                                          | The signed-in user                                     |
| `/households`, `/households/{id}`                                    | Households the caller can see                          |
| `/households/{id}/members`, `/invites`, `/invites/{token}/accept`    | Who has access                                         |
| `/asset-types`, `/manufacturers`, `/manufacturers/{id}/models`       | The catalogue that drives the add-asset form           |
| `/households/{id}/assets`, `/assets/{id}`                            | Assets                                                 |
| `/assets/{id}/telemetry`, `/households/{id}/telemetry`               | Measured series                                        |
| `/assets/{id}/logs`                                                  | What a device reported                                 |
| `/households/{id}/alerts`, `/alerts`, `/alerts/{id}`                 | Derived problems, per household and across all of them |
| `/devices`                                                           | Push registration for this handset                     |

## Error handling

`src/api/problem.ts` turns a failure into something a person can read. A problem detail is
shown as the server worded it, which means the API owns localising those; everything the
app words itself is in the catalogues. Network and timeout failures are worded by the app,
and so is the offline refusal.

Retry is offered only when retrying could plausibly help: server faults, rate limits and
network failures. A permission error does not get a button that will fail again.

## The mock server

```bash
npm run mock:start   # Prism in Docker, on localhost:4010/api/v1
npm run mock:local   # the same without Docker, for machines and CI that lack it
```

Prism serves the contract itself, returning the examples written into it, enforcing the
bearer token and rejecting requests that violate the schema, so the mock cannot drift from
what the client is generated against. Prism serves the contract's paths at the root with no
knowledge of the version prefix, so a small proxy in front restores `/api/v1` and the app
talks to the mock with exactly the URLs it sends to production.

Prism returns its examples regardless of query parameters, so filters are proven to be sent
but not proven to narrow anything. The in-process backend below does apply them.

## Fixtures and scenarios

`npm run fixtures` reads the examples out of the contract, follows schema references and
composes pages and envelopes the way a mock server would, then writes typed fixtures. If an
operation has no example, the generator names it.

Those fixtures back an in-process backend that can answer every request with no server at
all, chosen from Settings in a development build. It holds state between requests, so
acknowledging an alert or adding an asset sticks instead of snapping back on the next
refetch. Only operations whose answer depends on state need code, in
`src/mocks/handlers.ts`; everything else falls through to the contract example. A scenario
is a few lines in `src/mocks/scenarios.ts`.

One source of truth, three consumers: the mock server, the in-app scenarios and the tests.
See [decision 0010](decisions/0010-mock-at-the-api-boundary.md).
