# Decisions

One file per decision that shaped this codebase. Each says what was chosen, what was
rejected, and why. They are written once and not edited: if a decision is reversed, the new
record supersedes the old one rather than rewriting history.

| Decision                                 |                                                  |
| ---------------------------------------- | ------------------------------------------------ |
| [0001](0001-expo-with-prebuild.md)       | Expo with prebuild rather than bare React Native |
| [0002](0002-contract-first.md)           | The API contract is the source of truth          |
| [0003](0003-one-store-rtk-query.md)      | One Redux store with RTK Query for server state  |
| [0004](0004-own-design-system.md)        | Our own design system rather than a UI kit       |
| [0005](0005-polling-not-sockets.md)      | Polling rather than a socket                     |
| [0006](0006-server-derives-alerts.md)    | The server derives alerts, the app never does    |
| [0007](0007-refuse-offline-writes.md)    | Refuse writes offline rather than queueing them  |
| [0008](0008-no-analytics.md)             | No product analytics                             |
| [0009](0009-five-languages.md)           | Five languages behind a typed key surface        |
| [0010](0010-mock-at-the-api-boundary.md) | Mock at the API boundary, from contract fixtures |
| [0011](0011-path-segments-for-roles.md)  | Path segments rather than route groups for roles |
| [0012](0012-storage-scopes.md)           | Storage scoped to the handset or to the person   |
