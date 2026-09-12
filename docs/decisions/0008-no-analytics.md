# 0008. No product analytics

## Decision

The app sends no product analytics. Sentry collects crashes and errors, and nothing else
leaves the device. There is no third-party analytics SDK.

## Why

Analytics is a commitment, not a switch: a processor to name in a privacy policy, a consent
flow with a legal basis, a data retention answer, and a subject access request path. For an
EU consumer product handling household energy data, that is a real obligation and it should
be taken on deliberately, when someone intends to act on the numbers.

Nothing here needs analytics to be built. Where people drop out of adding an asset is a
question worth asking once there are people adding assets.

## Rejected

**A third-party SDK.** Funnels and retention for free, in exchange for another processor
and another network path out of the app.

**Our own event endpoint.** No third party, and still the same consent, retention and
policy obligations, plus a backend to build.

## Consequences

Crash reporting stays off unless a DSN is configured, so a local checkout reports nothing,
and it is disabled where its native layer does not exist.

Recently viewed, the one on-device behavioural trail, is off by default and sits behind its
own switch. See [0012](0012-storage-scopes.md).
