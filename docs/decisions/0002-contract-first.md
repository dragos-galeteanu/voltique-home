# 0002. The API contract is the source of truth

## Decision

An OpenAPI document lives in this repository at `src/contract/openapi.yaml`. The API
client, the mock server and the test fixtures are all generated from it. Generated output
is committed, and CI fails if it does not match the contract.

## Why

The backend did not exist when the app was built. Something had to define the shape of the
API, and the choice was between a document three tools read, or hand-written types, a
hand-written client and a hand-written mock that drift apart quietly.

Generating means a contract change arrives as a reviewable diff across every call site. It
also means the mock cannot lie: it serves the same document the client is generated from.

## Rejected

**Hand-written client and types.** Faster for the first endpoint, then a tax on every one
after, and no way to tell whether the mock still matches.

**Waiting for the backend to define it.** Would have blocked the app for months and handed
over the shape of the client to whoever wrote the first controller.

## Consequences

The contract is a design artefact, not documentation, so its examples have to stay
realistic: they are what the mock returns and what the end-to-end tests assert against.

When the real API appears, differences show up as contract edits, and the diff shows which
screens are affected.
