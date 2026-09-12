# Testing

Three layers, each proving something the others cannot.

## Jest

```bash
npm test
npm run test:watch
npm run test:coverage
```

Two projects, because they need different environments. **Logic**, including the API
client, runs in plain Node. **Components** run under the Expo preset, which they need for
the React Native runtime. The split keeps the whole suite around two seconds.

Requests are stubbed by a small fetch mock in `src/test`, which both proves what the client
sent and lets a test assert how many times it sent it. That matters for things like the
shared token refresh, where the interesting property is that several failures cause exactly
one refresh.

React Native Testing Library renders asynchronously, so `render` and `fireEvent` are both
awaited. Two renders in one test confuse the shared `screen`; use `it.each` instead.

## What is worth testing here

Logic that would be wrong in a way nobody notices: telemetry windows across both
daylight-saving transitions, energy integrated under a power curve with gaps in it, alert
ordering, the token refresh and its rollback, storage scoping, and the translation
catalogues staying in step.

Screens are covered end to end rather than unit tested, because what matters about a screen
is that the whole path works.

## Detox

```bash
npm run mock:start
npm run prebuild
npm run e2e:build:ios && npm run e2e:test:ios
# or
npm run e2e:build:android && npm run e2e:test:android
```

Detox drives the real app on a simulator or an emulator against the Prism mock, so the data
is identical on every run. The native projects are generated, so a build needs a prebuild
first, and the mock has to be running.

Specs select on `testID`, never on text, because text changes with the language. iOS
launches pin the simulator to English so that data from the mock still reads as expected.
On Android the app is pointed at `10.0.2.2`, since an emulator cannot see `localhost`.

Covered: signing in and staying signed in across a restart, the asset list and the
add-asset flow, the dashboard and its ranges, the alert inbox through to the device log,
invitations, and the installer shell including what it must not show.

## What is not tested, and why

Push delivery, because Detox cannot deliver a notification. The routing decision behind a
tap is a pure function with a test for every branch instead.

Offline behaviour end to end, because the app learns about connectivity from the device
rather than from failed requests, so blocking URLs in Detox would prove nothing. It is
covered in Jest by restoring a snapshot into a fresh store with the network stubbed out.

Anything that needs a physical device: push registration and the real keychain.

## Running what CI runs

```bash
npm run verify
```

Typecheck, lint, formatting and the Jest suite. CI adds a Metro bundle of both platforms, a
check that generated code matches the contract, and route type generation before
typechecking, since route paths are only checked when `.expo/types` exists.
