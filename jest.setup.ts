// React Native Testing Library v14 registers its matchers on import, no extra setup.

// Initialises i18next once for every test. Without it, useTranslation has no instance
// and components render their keys instead of copy.
import '@/i18n';

// Reanimated drives the sheet and the toast. Its native worklets runtime does not exist
// under Jest, so animations are stubbed and components render in their final state.
// The factory is hoisted above imports, hence the require inside it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]' })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  manufacturer: 'Apple',
  modelName: 'iPhone 17',
}));

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
