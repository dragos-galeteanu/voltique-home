/**
 * Detox drives the real app on a simulator or emulator, against the Prism mock so the
 * data is the same on every run.
 *
 * The native projects are generated, so `npm run prebuild` must have run before a build.
 * On Android the emulator reaches the host as 10.0.2.2, which is why its build sets
 * API_ORIGIN explicitly.
 */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 180_000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VoltiqueHome.app',
      build:
        'xcodebuild -workspace ios/VoltiqueHome.xcworkspace -scheme VoltiqueHome -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/VoltiqueHome.app',
      build:
        'xcodebuild -workspace ios/VoltiqueHome.xcworkspace -scheme VoltiqueHome -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
      build:
        'API_ORIGIN=http://10.0.2.2:4010 ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug -p android',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      build:
        'API_ORIGIN=http://10.0.2.2:4010 ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -p android',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 17' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_8_API_35' },
    },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
    'android.emu.release': { device: 'emulator', app: 'android.release' },
  },
};
