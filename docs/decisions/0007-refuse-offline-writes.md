# 0007. Refuse writes offline rather than queueing them

## Decision

While there is no connection, reads come from the cache and writes are refused with a
`client_offline` problem. Nothing is queued for later.

## Why

A queued write is a promise. It is applied minutes or hours later, against data that has
moved on, by an app the person may no longer have open. Acknowledging an alert that the
server reopened in the meantime, or adding an asset to a household that was deleted, fails
somewhere the person cannot see and cannot fix.

Being told plainly that a change needs a connection is worse for exactly one second and
better afterwards. It is also honest: the app knows the change did not happen.

The refusal lives in the API client rather than in each screen, so every screen reports it
in the same words, and adding a screen cannot forget to handle it.

## Rejected

**A write queue with replay.** The right answer for an app whose job is capture, such as
field data collection with no signal. This app's job is monitoring, and its writes are
small acts of acknowledgement that lose their meaning when delayed.

**Letting the request hang until it times out.** The default, and it looks like the app is
broken.

## Consequences

Connectivity is treated as usable until proven otherwise, so nothing is blocked before the
first check and no banner flashes at launch.

If offline acknowledgement ever becomes a real need, this becomes a queue with conflict
handling and a way for someone to see what is pending, which is a feature rather than a
change of policy.
