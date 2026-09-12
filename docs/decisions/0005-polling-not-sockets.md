# 0005. Polling rather than a socket

## Decision

Live data arrives by polling, tuned per screen. Alerts poll every thirty seconds wherever
you are, the dashboard refreshes the day range each minute, and logs never poll.

## Why

Alerts are small and matter quickly, which is what a badge count needs. Telemetry is large
and changes slowly, and a finished week or month cannot change at all. Polling lets each of
those have its own answer, with no connection lifecycle, no reconnection logic, no
authentication on a second channel and no second shape of the contract to keep in step.

On mobile networks, a polling client degrades predictably. A socket degrades into a
reconnection loop nobody sees until it drains a battery.

## Rejected

**WebSockets.** Genuinely live, and the right answer when someone is watching a value move
second by second. Nothing here is that.

**Server-sent events.** Simpler than a socket and survives proxies well, but still a
connection to manage, and React Native needs a library for it.

## Consequences

A fault can be up to thirty seconds old in the app. Push notifications cover the case where
that is not good enough, which is when the app is not open at all.

If live per-second data is ever needed, this is the decision to revisit first.
