# 0011. Path segments rather than route groups for roles

## Decision

The two shells live at `/consumer` and `/installer` as real path segments. Tabs sit in a
route group inside each shell.

## Why

The first version used route groups for both shells. Groups are stripped from the URL, so
`(consumer)/alerts` and `(installer)/alerts` both resolved to `/alerts`, as did both
settings screens. Navigation would have landed on whichever matched first, and the failure
would have looked like a routing bug rather than a naming collision.

Explicit segments also make deep links unambiguous, which matters because a notification can
open a specific screen for a specific role.

Tabs stay in a group because that layer has no collision: it exists so a detail screen or a
modal can cover the tabs rather than being squeezed into one.

## Rejected

**Groups with role-distinct child names**, such as `(installer)/job-alerts`. Keeps the URLs
short and makes every file name worse.

## Consequences

Routes read as what they are, and the generated route table shows each shell separately.

This was caught by generating the typed route table and reading it, not by testing. It is
the reason CI regenerates route types before typechecking.
