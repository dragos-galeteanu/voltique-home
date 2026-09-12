# 0003. One Redux store with RTK Query for server state

## Decision

A single Redux Toolkit store. Client state lives in slices; every server response belongs
to one RTK Query API slice that features extend with `injectEndpoints`.

## Why

Server state and client state have different problems. Caching, refetching, invalidation and
request deduplication are worth having as a library rather than as code we wrote. Keeping
them in the same store as client state means one set of devtools, one place to inspect, and
one thing to persist for offline use.

Tags derived from the contract mean invalidation is declared rather than remembered, which
is the part people get wrong by hand.

## Rejected

**Redux plus a separate query library.** Two state systems, two mental models, and the
offline snapshot becomes two problems instead of one.

**Redux with hand-written thunks.** Every caching decision becomes ours, including the ones
we would not think to make.

## Consequences

Behaviour the generator cannot infer, such as optimistic updates, is layered on with
`enhanceEndpoints` rather than edited into generated files, so regenerating stays safe.

Persisting the cache for offline use required understanding RTK Query's internal shape,
which is documented in the storage notes rather than assumed.
