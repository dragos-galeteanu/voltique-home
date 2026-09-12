# Getting started

## What you need

| Tool                   | Needed for              | Notes                                             |
| ---------------------- | ----------------------- | ------------------------------------------------- |
| Node 22 LTS            | everything              | `nvm use`, the version is in `.nvmrc`             |
| Watchman               | Metro file watching     | `brew install watchman`                           |
| Xcode, full install    | iOS builds              | Command Line Tools alone are not enough           |
| CocoaPods              | iOS native dependencies | needs Ruby 3.x; use rbenv rather than system Ruby |
| Android Studio, JDK 17 | Android builds          | set `ANDROID_HOME`                                |
| Docker                 | the local mock API      | optional, see below                               |

The app cannot run in Expo Go. Charts run on Skia, push notifications need their own
native module, and neither is bundled into Expo Go, so a build you compile yourself is the
only way to run it.

## First run

```bash
nvm use
npm install
cp .env.example .env.local
npm run mock:start
npm run ios          # or: npm run android
```

`npm run ios` builds the native app and starts Metro. The first build takes a while; after
that, `npm start` is enough unless native dependencies changed.

## Native projects

`ios/` and `android/` are generated and not committed. Regenerate them with:

```bash
npm run prebuild
```

Native configuration belongs in `app.config.ts` or in an Expo config plugin. Anything
edited directly inside `ios/` or `android/` is lost on the next prebuild.

## Build variants

`APP_VARIANT` picks the identity and the defaults at build time.

| Variant     | Name                    | Identifier                |
| ----------- | ----------------------- | ------------------------- |
| development | Voltique Home (Dev)     | com.voltique.home.dev     |
| staging     | Voltique Home (Staging) | com.voltique.home.staging |
| production  | Voltique Home           | com.voltique.home         |

All three install side by side. `API_ORIGIN` overrides the API host: set the origin only,
since the client appends `/api/v1` itself. An Android emulator reaches the host machine at
`10.0.2.2` rather than `localhost`.

## The local mock API

```bash
npm run mock:start   # Docker: Prism serving the contract on localhost:4010/api/v1
npm run mock:logs
npm run mock:stop
npm run mock:local   # the same thing without Docker
```

Both serve the examples written into the contract, enforce the bearer token and reject
requests that do not match the schema. Details in [API and contract](api.md).

## Running without a backend

A development build can answer every request in-process, with no server at all. Open
Settings, then Mock scenarios, and pick one:

| Scenario             | What you get                                                          |
| -------------------- | --------------------------------------------------------------------- |
| Populated household  | The contract examples: three assets, three alerts, a day of telemetry |
| Brand new account    | Nothing yet, for checking every empty state                           |
| Everything is broken | Assets faulted and alerts open                                        |
| Installer view       | Signed in as an installer, alerts across more than one household      |
| Slow network         | Two seconds per request, so loading states are visible                |
| API is down          | Every request answers 503                                             |

This replaces the transport and nothing else, so loading, refetching, invalidation and
optimistic updates all still happen. The choice survives a reload. See
[API and contract](api.md#fixtures-and-scenarios).

## Scripts

| Script                                                       | Purpose                                               |
| ------------------------------------------------------------ | ----------------------------------------------------- |
| `npm start`                                                  | Metro dev server                                      |
| `npm run ios`, `npm run android`                             | build and run the native app                          |
| `npm run prebuild`                                           | regenerate the native projects from config            |
| `npm run verify`                                             | typecheck, lint, formatting and tests, the same as CI |
| `npm run typecheck`                                          | `tsc --noEmit`                                        |
| `npm run lint`, `lint:fix`                                   | ESLint                                                |
| `npm run format`, `format:check`                             | Prettier                                              |
| `npm test`, `test:watch`, `test:coverage`                    | Jest                                                  |
| `npm run typegen`                                            | regenerate typed route definitions                    |
| `npm run codegen`                                            | regenerate the API client from the contract           |
| `npm run fixtures`                                           | regenerate mock fixtures from the contract            |
| `npm run contract:lint`                                      | validate the OpenAPI document                         |
| `npm run mock:start`, `mock:stop`, `mock:logs`, `mock:local` | the mock API                                          |
| `npm run e2e:build:ios`, `e2e:test:ios`                      | Detox on a simulator                                  |
| `npm run e2e:build:android`, `e2e:test:android`              | Detox on an emulator                                  |
| `npm run doctor`                                             | Expo dependency and config diagnostics                |

## Known toolchain gap

`eslint-config-expo` is not compatible with ESLint 10, whose removed context APIs break
its bundled React plugin. ESLint is pinned to 9 until Expo ships a fix.
