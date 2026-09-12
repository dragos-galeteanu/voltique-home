# 0006. The server derives alerts, the app never does

## Decision

An alert is created server-side from device logs, telemetry thresholds or lost contact. The
app reads alerts and can only acknowledge or resolve them. There is no delete.

## Why

Threshold rules belong next to the data. Every client must agree on what counts as a fault,
including a future web dashboard and whatever sends the notifications. A rule implemented in
the app would be a second opinion, and the two would disagree eventually.

Deduplication has to happen where the events are. Two hundred repeating log lines are one
problem, and the count is part of the problem's identity.

No delete, because a resolved alert reopens by itself if the condition returns. Offering a
delete would promise something the platform cannot honour.

## Rejected

**Deriving alerts in the app from raw logs.** Would have unblocked the alert screens before
the backend existed, at the price of every client inventing its own idea of a fault.

## Consequences

The app is useless for alerts until the backend implements the derivation. The contract
describes exactly what it must produce, including what each alert was derived from, which is
shown in the UI.

Asset status is tied to alerts: an asset reads as faulted when it has an open critical
alert, so status and alerts can never disagree.
