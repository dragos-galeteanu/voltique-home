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
app.config.ts      build-time config and per-variant identity
src/app/           expo-router routes
src/config/        validated runtime configuration
assets/            icons and splash
```

## Conventions

Commits follow Conventional Commits, enforced by commitlint on `commit-msg`.
Staged files are linted and formatted on `pre-commit`.

## Known toolchain gap

`eslint-config-expo` is not compatible with ESLint 10, whose removed context APIs break
its bundled React plugin. ESLint is pinned to 9 until Expo ships a fix.
