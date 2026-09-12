# 0012. Storage scoped to the handset or to the person

## Decision

Every key the app stores is declared in one registry with a backend, a schema, a version and
a scope. Scope is either `device` or `person`. Signing out clears every `person` key.

## Why

Two questions kept coming up separately and have the same answer: what does the app keep,
and what happens to it when someone signs out. Answering them in one file makes both
reviewable, and makes a privacy question something to look up rather than to investigate.

The scope split is the useful part. The theme belongs to the phone; the cached data,
where you left off and anything you recently opened belong to the account. A phone handed to
someone else should remember only how the screen looked, and that is now one rule rather
than a decision taken again per feature.

Versions and schemas make a stored value disposable. Anything that no longer fits is dropped
rather than repaired, which is the right trade for a cache and for preferences.

## Rejected

**Direct calls to AsyncStorage and the keychain where needed.** Least indirection, and
within months nobody can list what the app stores.

**Folding everything into the offline snapshot.** It already persisted preferences, which
meant signing out either wiped the theme or kept the data. Splitting them was the fix.

## Consequences

Adding a key is a visible change to one file, and three tests hold the guarantees: no token
reaches plain storage, sign-out leaves no person-scoped key, and an outdated value is
discarded.

Recently viewed, the only behavioural trail, is person-scoped, off by default, and deleted
rather than hidden when switched off.
