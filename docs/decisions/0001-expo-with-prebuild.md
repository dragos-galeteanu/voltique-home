# 0001. Expo with prebuild rather than bare React Native

## Decision

Build on Expo SDK 57 with continuous native generation. `ios/` and `android/` are generated
by `npm run prebuild` and are not committed.

## Why

Full native access is still available, through config plugins and any native module, but
the Podfile, the Gradle files and the upgrade path stop being ours to maintain. Expo
upgrades then move one version number rather than a hundred lines of native configuration.

Not committing the native projects means they cannot drift from `app.config.ts`. The cost
is that native changes must be expressed as configuration or as a plugin, which is a
constraint worth having: an edit made directly in `ios/` is silently lost, and being forced
to write it down is better than discovering that later.

## Rejected

**Bare React Native.** Maximum control, and every upgrade becomes a manual reconciliation of
native files that nobody wants to own.

**Expo managed with cloud builds only.** Simplest day to day, but end-to-end tests need
local builds and native debugging is limited.

## Consequences

The app cannot run in Expo Go once it uses a module Expo Go does not bundle, which happened
when charts arrived. A development build is required from that point on.
