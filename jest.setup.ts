// React Native Testing Library v14 registers its matchers on import, no extra setup.

// Reanimated drives the sheet and the toast. Its native worklets runtime does not exist
// under Jest, so animations are stubbed and components render in their final state.
// jest.mock factories are hoisted above imports, so the mock is required inside it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Secure storage is a native module; tests exercise the code that calls it, not the
// keychain itself.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'whenUnlockedThisDeviceOnly',
}));

// Device language is a native lookup; tests run in English unless one asks otherwise.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US', regionCode: 'US' }],
}));

// app.config.ts is resolved at build time, so tests supply the same shape directly.
jest.mock('expo-constants', () => ({
  __esModule: true,
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
  default: {
    executionEnvironment: 'bare',
    expoConfig: {
      extra: {
        appVariant: 'development',
        apiOrigin: 'http://localhost:4010',
        appVersion: '0.0.0-test',
        buildNumber: '0',
      },
    },
  },
}));
