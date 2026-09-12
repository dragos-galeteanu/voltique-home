# Voltique Home

React Native app for household energy. Consumers add energy assets to a household and
track what it produces, stores and uses. Installers get scoped access to the same
households to fix what breaks.

- **Runtime**: Expo SDK 57, React Native 0.86, React 19, TypeScript in strict mode
- **Routing**: expo-router with typed routes
- **State**: Redux Toolkit and RTK Query, one store
- **API**: RESTful under `/api/v1`, defined by an OpenAPI contract in this repository
- **Languages**: English, German, French, Italian, Spanish

## Running it

```bash
nvm use
npm install
cp .env.example .env.local
npm run mock:start
npm run ios          # or: npm run android
```

That needs the native toolchain. The app uses Skia and other native modules, so it cannot
run in Expo Go. [docs/getting-started.md](docs/getting-started.md) covers what to install
and how to run against the mock API, or against no backend at all.

## Where to go next

| If you want to                                 | Read                                       |
| ---------------------------------------------- | ------------------------------------------ |
| Get it running and know the scripts            | [Getting started](docs/getting-started.md) |
| Understand how a screen reaches the API        | [Architecture](docs/architecture.md)       |
| Know what a household, an asset or an alert is | [Domain](docs/domain.md)                   |
| Change an endpoint or the mock                 | [API and contract](docs/api.md)            |
| Add a screen or a route                        | [Navigation and roles](docs/navigation.md) |
| Touch sign-in, tokens or sign-out              | [Authentication](docs/auth.md)             |
| Store something on the device                  | [Storage](docs/storage.md)                 |
| Add or change any user-facing text             | [Languages](docs/i18n.md)                  |
| Write or run tests                             | [Testing](docs/testing.md)                 |
| Ship a build                                   | [Releasing](docs/releasing.md)             |
| Know why something is the way it is            | [Decisions](docs/decisions/README.md)      |

Conventions that apply to every change are in [AGENTS.md](AGENTS.md), and they are read by
people and by coding agents alike.

## Status

Everything above is built and covered by tests: sign-in with token refresh, households and
assets, a charted dashboard, alerts with the device logs behind them, invitations and the
installer role, push notifications, an offline read cache, and a release pipeline.

The backend does not exist yet. The app runs against a mock generated from the contract,
either as a local server or entirely in-process. See
[Running without a backend](docs/getting-started.md#running-without-a-backend).
