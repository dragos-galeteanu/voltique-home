# 0010. Mock at the API boundary, from contract fixtures

## Decision

When there is no backend, the app answers requests from an in-process backend built on
fixtures generated from the contract. It replaces the transport and nothing else. Scenarios
are chosen from a development-only screen.

## Why

The alternative was seeding the Redux store directly, which is faster to build and skips
everything worth exercising: loading states never appear, refetching never happens,
invalidation is never triggered, and optimistic updates have nothing to roll back against.
Those paths are exactly where the bugs are.

Generating the fixtures from the contract's own examples means the mock server, the in-app
scenarios and the tests share one source of truth. That was verified rather than assumed:
for several operations the generated fixtures are byte-identical to what the mock server
returns.

The fake backend holds state between requests, so acknowledging an alert sticks instead of
snapping back on the next refetch. Only operations whose answer depends on state need code;
everything else falls through to the contract example, which is what keeps it from becoming
a second implementation of the backend.

## Rejected

**Seeding the store.** Kept for tests that need an exact state, such as an empty list or a
specific error, where driving it through a fake backend is indirection for its own sake.

**Mock Service Worker.** Ships modules the Expo transform will not process. A small fetch
stub in the repository does what the tests need.

## Consequences

The fixtures are bundled into release builds, about thirty kilobytes, which is not worth
guarding against. The picker is gated on a development build.

An operation with no example in the contract has no fixture, and the generator names it,
which is a quiet pressure to keep the contract's examples complete.
