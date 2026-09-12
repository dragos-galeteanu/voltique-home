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

## Running it without Xcode

The app uses only modules bundled into Expo Go, so it runs on a physical phone today,
before the native toolchain is set up.

```bash
npm run mock:start && npm start
```

Scan the QR code with Expo Go. The phone cannot reach `localhost`, so point the app at
the machine's address on the network by setting `API_ORIGIN` in `.env.local` to
something like `http://192.168.1.20:4010` before starting.

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

## API contract

[`src/contract/openapi.yaml`](src/contract/openapi.yaml) is the source of truth. It
describes every resource under `/api/v1`, the problem-details error bodies, cursor
pagination and the units carried by every measurement.

Two things are generated from it and nothing else in the app is allowed to restate them:

```bash
npm run codegen
```

That writes `src/api/generated/endpoints.ts`, a typed RTK Query endpoint per operation
plus its hooks. The output is committed, so a fresh checkout builds without running
codegen and a contract change arrives as a reviewable diff. The tag names in the contract
match the `tagTypes` on the API slice, which is what lets cache invalidation be derived
rather than hand-written. Generated code is excluded from ESLint but still formatted.

The same document is the mock:

```bash
npm run mock:start
```

Prism serves the contract on `http://localhost:4010/api/v1`, returning the examples
written into the spec, enforcing bearer auth, and rejecting requests that violate the
schema. The mock therefore cannot drift from what the app is generated against. Prism
itself serves the contract's paths at the root with no knowledge of the version prefix,
so a small nginx container in front puts `/api/v1` back; the app talks to the mock with
exactly the URLs it sends to production.

Since the spec's examples are what the mock returns, they double as the fixtures for
end-to-end runs. Keep them realistic.

`npm run mock:local` serves the same thing without Docker, for machines and CI runners
that have no daemon. It runs Prism directly with a small proxy in front for the version
prefix, which is what the iOS end-to-end job uses on its macOS runner.

## Testing

Two layers, with different jobs.

**Jest** covers logic and components, and runs as two projects. Logic, including the API
client, runs in a plain Node environment; components run under the Expo preset because
they need the React Native runtime. The split keeps the whole suite around two seconds.
Requests are stubbed by a small fetch mock in `src/test`, which both proves what the
client sent and lets a test assert how many times it sent it.

**Detox** drives the real app on a simulator or an emulator against the Prism mock, so
the data is identical on every run. The native projects are generated, so a build needs
`npm run prebuild` first, and the mock has to be running:

```bash
npm run mock:start && npm run e2e:build:ios && npm run e2e:test:ios
```

Every interactive element carries a `testID`, which is what both layers select on.
Detox on Android points the app at `10.0.2.2`, since an emulator cannot see `localhost`.

## Dashboard

Charts are Victory Native on Skia. The chart component draws what it is handed and owns
no fetching, no range logic and no derived figures, so the household view and the
per-asset view share it.

Time windows are computed in the household's timezone, never the device's, because that
is where the server buckets daily and monthly totals. The logic is tested against both
daylight-saving transitions, since those days are 23 and 25 hours long and a naive
implementation is wrong twice a year.

A null bucket means the server had no reading. It is drawn as a break in the line and
contributes nothing to a total, because an inverter that was unreachable at noon did not
produce zero, it produced an unknown amount.

Only the day range keeps polling. A finished week or month cannot change.

## Working offline

The last data the API returned survives a cold start, so a phone with no signal in a
cellar still shows the dashboard, the asset list and the alerts it showed last time,
under a banner saying when the data was captured.

What is kept is deliberately narrow. Only queries that completed are written to disk;
pending and failed ones would restore as a spinner for a request nobody made. Mutations
are dropped entirely, so no write can ever come back from a file. The session is never
persisted here: tokens belong in the keychain, and a test asserts the snapshot contains
no access token.

Writes are refused while offline rather than queued. A queued change the person cannot
see, applied minutes later against data that has moved on, is worse than being told
plainly that it needs a connection. The refusal happens in one place, the API client, so
every screen reports it the same way.

Connectivity treats unknown as usable. Nothing is blocked before the first check, which
is why the banner does not flash on launch.

## Notifications

Faults are pushed through the Expo push service. The handset registers its token with our
API after signing in, and unregisters on sign out, so a shared phone stops receiving
someone else's faults. The token is write-only in the contract: no endpoint returns it,
because holding it is enough to send to the device.

Permission is asked for on the alerts screen, not at first launch. Someone looking at a
list of faults understands what they are agreeing to; someone who has just installed the
app does not, and usually refuses. Declining hides the prompt rather than repeating it.

Tapping a notification opens what it refers to, including when it launched the app from
cold. A consumer lands on the alert, where it can be acknowledged. An installer has no
alert screen, so they land on the device log, which is what they actually need. Anything
unrecognised opens nothing rather than guessing.

Which faults reach a handset is a per-device setting, held by the server rather than
mirrored locally, so it survives a reinstall and can differ between someone's phone and
their tablet.

## Roles and access

A household owner invites people from settings. A resident sees everything and can add
assets; an installer gets assets, their logs and their faults, and nothing about the
household itself. The screen says which, in those words, before you send the invitation.

Invitations arrive as a link into the app, `voltique://invite/<token>`. Opened while
signed out, the token is held and the person is sent to sign in, and the entry route
brings them back to it afterwards, so a link is never lost. Universal and app links are
not configured yet: that needs the domain association files, which belong with the real
domain.

The installer shell is a different set of tabs behind the same sign-in. It lists the
households that invited them, each household's assets and open faults, and a
cross-household fault list, which is why the contract has a top-level alert collection
alongside the per-household inbox. Device logs live at a shared route reachable by both
roles, because duplicating that screen per role would be the thing that drifts.

What an installer may actually see is the server's decision, not the app's. The app hides
what it knows is irrelevant; it does not pretend to enforce anything.

## Alerts and logs

Three ideas, kept apart deliberately. Telemetry is measurement, logs are what the device
said, and an alert is the platform's interpretation: a deduplicated problem with a
lifecycle, derived server-side from logs, thresholds or lost contact.

The app reads alerts and can only acknowledge or resolve them. It never decides what
counts as a fault, and there is no delete, because a resolved alert reopens by itself if
the condition returns. Both actions are optimistic and roll back if the server refuses.

The alert inbox is the one list worth polling, since the payload is small and the tab
badge depends on it. Device logs are paged by cursor and never refetched on their own.

## Languages

The app ships in English, German, French, Italian and Spanish, following the device
language, with an override in settings. English in `src/i18n/locales/en.json` is the
source catalogue; the rest are translated from it.

Keys are type-checked against English, so a missing or renamed key is a compile error
rather than a string that renders as itself. Tests additionally assert that every locale
has exactly English's keys, that no value is empty, and that no translation drops an
interpolated value.

Numbers, dates and relative times are formatted through `Intl` with the active locale, so
a German reader sees a comma in every kilowatt figure. Nothing outside
`src/lib/format-energy.ts` converts a unit.

Server-sent error text is shown as it arrives, which means the API is responsible for
localising problem details. Everything the app words itself is in the catalogues.

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

## Continuous integration and releases

Every pull request runs the contract validation, a check that the generated client is not
stale, typecheck, lint, formatting and the Jest suite, plus a Metro bundle of both
platforms. Detox is too slow for that, so it runs nightly and before every release.

Releases are manual and deliberate: pick a platform and a variant, and the workflow runs
the end-to-end suite, regenerates the native projects, then ships to TestFlight and the
Play internal track. [docs/releasing.md](docs/releasing.md) covers the accounts, the
signing material and the secrets, none of which live in this repository.

Route paths are only type-checked when `.expo/types` exists, and that folder is not
committed, so CI regenerates it with `npm run typegen` before typechecking.

## Known gaps

## Known toolchain gap

`eslint-config-expo` is not compatible with ESLint 10, whose removed context APIs break
its bundled React plugin. ESLint is pinned to 9 until Expo ships a fix.
