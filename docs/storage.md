# Storage

Everything the app keeps on the device is declared in one file,
[`src/storage/registry.ts`](../src/storage/registry.ts). If it is not listed there, the
app does not keep it. Screens never call AsyncStorage or the keychain directly, which is
what makes that list worth trusting.

## What is stored

| Key              | Where    | Belongs to | Holds                                                  |
| ---------------- | -------- | ---------- | ------------------------------------------------------ |
| `session`        | keychain | person     | Access and refresh tokens, and who they belong to      |
| `appearance`     | plain    | handset    | Theme and language preference                          |
| `prompts`        | plain    | handset    | Whether the notification prompt was dismissed          |
| `viewState`      | plain    | person     | Last dashboard range, alert filter, selected household |
| `recentlyViewed` | plain    | person     | Last few assets and households opened, off by default  |
| `cache`          | plain    | person     | The offline read cache                                 |
| `dev`            | plain    | handset    | Which mock scenario is running, development only       |

## Scopes

Scope is the column that does the work.

**Handset** outlives the account. How the screen looks, and what has already been
dismissed, are properties of the phone rather than of whoever is signed in.

**Person** is wiped on sign-out. The session, the cached data, where they left off and
anything they recently opened all go, so a phone handed to someone else remembers only how
the screen looked.

## What each entry declares

A backend, a scope, a schema and a version. A stored value whose version does not match, or
that no longer fits its schema, is discarded rather than repaired. Nothing in the module
throws: a device with unreadable storage runs on defaults instead of refusing to start.

## The offline cache

The last data the API returned survives a cold start, so a phone with no signal still shows
the dashboard, the asset list and the alerts it showed last time, under a banner saying when
the data was captured.

What is kept is deliberately narrow. Only queries that completed are written; a pending or
failed one would restore as a spinner for a request nobody made. Mutations are dropped
entirely, so no write can ever come back from a file. The tag index is kept, because
invalidation after the next successful write needs to know which restored entries a tag
covers.

Writes are refused while offline rather than queued. See
[decision 0007](decisions/0007-refuse-offline-writes.md).

## Recently viewed

The only thing here that records behaviour, and therefore the only thing behind a switch.
It is off until turned on in settings, the copy says plainly that it stays on the phone,
and turning it off deletes what was collected rather than hiding it.

Remembering the last tab, or that a prompt was dismissed, is a preference rather than
tracking. Putting a consent prompt in front of that would only teach people to dismiss
prompts. The app collects no analytics of any kind; see
[decision 0008](decisions/0008-no-analytics.md).

## Adding something

1. Add an entry to the registry with a backend, a scope, a schema and version 1.
2. Read it where the state is hydrated, and project it back where state is persisted.
3. If it holds anything about a person, scope it `person` and check it disappears on
   sign-out. There is a test that asserts exactly that.

Bump the version whenever the shape changes. Old values are then dropped rather than
misread, which is cheaper and safer than writing a migration for a cache.
