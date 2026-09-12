# Voltique Home

React Native app for household energy assets. Consumers add assets to a household and
track consumption, production and faults. Installers get scoped access to the same
households for maintenance.

- **Runtime**: Expo SDK 57, React Native 0.86, React 19, TypeScript strict
- **Routing**: expo-router with typed routes
- **State**: Redux Toolkit and RTK Query (M1)
- **API**: RESTful, all routes under `/api/v1`

## Prerequisites

| Tool                   | Needed for          | Notes                                             |
| ---------------------- | ------------------- | ------------------------------------------------- |
| Node 22 LTS            | everything          | see `.nvmrc`, `nvm use`                           |
| Watchman               | Metro file watching | `brew install watchman`                           |
| Xcode (full)           | iOS builds          | Command Line Tools alone are not enough           |
| CocoaPods              | iOS native deps     | needs Ruby 3.x, use rbenv rather than system Ruby |
| Android Studio, JDK 17 | Android builds      | set `ANDROID_HOME`                                |

## Setup

```bash
nvm use
npm install
cp .env.example .env.local
npm start
```

## Native projects

`ios/` and `android/` are generated, not committed. Regenerate them with:

```bash
npm run prebuild
```

Native configuration belongs in `app.config.ts` or in an Expo config plugin. Edits made
directly inside `ios/` or `android/` are lost on the next prebuild.

## Build variants

`APP_VARIANT` selects identity and defaults at build time.

| Variant     | Name                    | Identifier                |
| ----------- | ----------------------- | ------------------------- |
| development | Voltique Home (Dev)     | com.voltique.home.dev     |
| staging     | Voltique Home (Staging) | com.voltique.home.staging |
| production  | Voltique Home           | com.voltique.home         |

All three can be installed side by side. `API_ORIGIN` overrides the API host for a
variant. Set the origin only, since the client appends `/api/v1` itself. On an Android
emulator the host machine is `10.0.2.2`, not `localhost`.

## Scripts

| Script                            | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `npm start`                       | Metro dev server                             |
| `npm run ios` / `npm run android` | build and run the native app                 |
| `npm run prebuild`                | regenerate native projects from config       |
| `npm run typecheck`               | `tsc --noEmit`                               |
| `npm run lint` / `lint:fix`       | ESLint                                       |
| `npm run format` / `format:check` | Prettier                                     |
| `npm run verify`                  | typecheck, lint and format check, same as CI |
| `npm run doctor`                  | Expo dependency and config diagnostics       |

## Layout

```
app.config.ts        build-time config and per-variant identity
plugins/             Expo config plugins for native tweaks
src/app/             expo-router routes
src/api/             RTK Query client, base query, shared wire types
src/store/           store, typed hooks, listener middleware
src/features/        auth, ui, settings; one folder per domain
src/design-system/   tokens, themes, primitives, toast
src/components/      shared components that are not design primitives
assets/              icons and splash
```

## Architecture

**State.** One Redux store. Client state lives in slices under `src/features`; server
state belongs to the single RTK Query API slice, which features extend with
`injectEndpoints` so no file grows with the API surface. Side effects such as session
persistence run in listener middleware, keeping reducers pure.

**Auth.** The session is held in the `auth` slice and mirrored into the device keychain.
On a cold start the app holds the splash screen while the stored session is read, so no
screen renders against a half-known identity. The API client attaches the access token,
and on a 401 it refreshes once, replays the request, and signs the user out if the
refresh fails. Concurrent 401s share one refresh.

**Roles.** Consumer and installer each own a navigation shell under `src/app/consumer`
and `src/app/installer`, guarded by a role gate that redirects rather than erroring.
These are real path segments, not route groups, because groups are stripped from the URL
and both shells have an alerts and a settings screen.

**Design system.** Screens never name a colour. They name a semantic role such as
`production` or `danger`, which the theme maps per mode. React Navigation's theme is
derived from the same source, so headers and tab bars cannot drift.

## Conventions

Commits follow Conventional Commits, enforced by commitlint on `commit-msg`.
Staged files are linted and formatted on `pre-commit`.

## Known gaps

Typed routes are generated into `.expo/types` by the dev server, and that folder is not
committed. A CI typecheck therefore validates everything except route paths until the
pipeline regenerates them, which M5 sorts out.

## Known toolchain gap

`eslint-config-expo` is not compatible with ESLint 10, whose removed context APIs break
its bundled React plugin. ESLint is pinned to 9 until Expo ships a fix.
