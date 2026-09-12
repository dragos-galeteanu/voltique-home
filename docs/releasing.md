# Releasing

Releases are manual. Open the Release workflow in GitHub Actions, choose a platform and
a variant, and run it. It runs the end-to-end suite first, then builds and uploads. The
run number becomes the build number on both stores, so the two stay in step.

The marketing version comes from `version` in `package.json`. Bump it there, in its own
commit, before shipping a version people will talk about.

## Before the first release

Nothing in this repository can produce a shippable build on its own. Four things have to
exist outside it.

**An App Store Connect record** for `com.voltique.home`, plus an API key with the App
Manager role. The key is a `.p8` file; store its contents base64 encoded.

**A signing repository** for match. It is a private git repository holding encrypted
certificates and provisioning profiles. Create it, then run the lane below once from a
machine that already has the signing identity. This is the only lane a person runs by
hand, and it is deliberately not in CI.

```bash
bundle exec fastlane ios certificates
```

**A Play Console record** for the same identifier, with an internal testing track, plus a
service account granted release permission. Google requires the first build on a track to
be uploaded by hand, so do that once before trusting the lane.

**An upload keystore** for Android. Generate it, back it up somewhere durable, and store
it base64 encoded. Losing it means losing the ability to update the app.

## Secrets

All of these live in GitHub repository secrets. None belongs in the repository.

| Secret                          | Used by | What it is                                          |
| ------------------------------- | ------- | --------------------------------------------------- |
| `APPLE_ID`                      | iOS     | Apple account email used for uploads                |
| `APPLE_DEVELOPER_TEAM_ID`       | iOS     | Developer portal team                               |
| `APP_STORE_CONNECT_TEAM_ID`     | iOS     | App Store Connect team                              |
| `APP_STORE_CONNECT_KEY_ID`      | iOS     | API key identifier                                  |
| `APP_STORE_CONNECT_ISSUER_ID`   | iOS     | API key issuer                                      |
| `APP_STORE_CONNECT_KEY_CONTENT` | iOS     | The `.p8` key, base64 encoded                       |
| `MATCH_GIT_URL`                 | iOS     | Signing repository                                  |
| `MATCH_GIT_BASIC_AUTHORIZATION` | iOS     | Token for that repository, base64 encoded           |
| `MATCH_PASSWORD`                | iOS     | Passphrase the signing repository is encrypted with |
| `ANDROID_KEYSTORE_BASE64`       | Android | Upload keystore, base64 encoded                     |
| `ANDROID_KEYSTORE_PASSWORD`     | Android | Keystore password                                   |
| `ANDROID_KEY_ALIAS`             | Android | Key alias inside the keystore                       |
| `ANDROID_KEY_PASSWORD`          | Android | Key password                                        |
| `PLAY_SERVICE_ACCOUNT_JSON`     | Android | Service account JSON, whole file                    |

## What a release run does

1. Runs the end-to-end suite on a simulator and an emulator, and stops if anything fails.
2. Regenerates `ios/` and `android/` from `app.config.ts` with the chosen variant and the
   run number as the build number. No lane edits an Xcode project or a Gradle file.
3. On iOS, fetches signing assets read-only through match, builds, and uploads to
   TestFlight without waiting for processing.
4. On Android, builds a signed app bundle and uploads it to the internal track as a
   draft, so a person still has to promote it.

## Store listing copy

The drafts in `fastlane/metadata` are not uploaded by a release. Both lanes skip metadata
so shipping a build cannot overwrite a live listing. Upload it deliberately once the
wording is approved.

## Running a lane locally

Possible, and occasionally useful, but it needs the same secrets in your environment.
Prefer the workflow: it is the only path that has been through the end-to-end suite.

```bash
bundle install
APP_VARIANT=staging BUILD_NUMBER=$(date +%Y%m%d%H%M) bundle exec fastlane ios beta
```
