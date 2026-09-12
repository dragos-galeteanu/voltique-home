const transformIgnorePatterns = [
  // The Expo preset's allowlist plus the ESM-only packages we depend on: Redux Toolkit
  // ships Immer and Reselect as ESM, and react-redux has an ESM legacy build.
  '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@reduxjs/toolkit|immer|redux|reselect|redux-thunk|react-redux|use-sync-external-store))',
  '/node_modules/react-native-reanimated/plugin/',
  '/node_modules/@react-native/babel-preset/',
];

const moduleNameMapper = { '^@/(.*)$': '<rootDir>/src/$1' };

/**
 * Two suites with different needs.
 *
 * Logic, including the API client, has no React Native in it and runs in a plain Node
 * environment. That keeps it fast and avoids the preset's animation-frame shim, whose
 * timers outlive a test and make Jest hang for twenty seconds on exit.
 *
 * Components need the React Native runtime, so they use the Expo preset.
 */
module.exports = {
  projects: [
    {
      displayName: 'logic',
      preset: 'jest-expo/node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      // The project has no babel.config.js, so the transform is named explicitly.
      transform: {
        '^.+\\.[jt]sx?$': ['babel-jest', { presets: ['babel-preset-expo'] }],
      },
      moduleNameMapper,
      transformIgnorePatterns,
      testMatch: ['<rootDir>/src/**/*.test.ts'],
    },
    {
      displayName: 'components',
      preset: 'jest-expo',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      // Worklets ships a resolver that keeps Jest away from its `.native` entry points,
      // which expect a runtime that only exists on a device.
      resolver: 'react-native-worklets/jest/resolver.js',
      moduleNameMapper,
      transformIgnorePatterns,
      testMatch: ['<rootDir>/src/**/*.test.tsx'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/api/generated/**',
    '!src/test/**',
    '!src/**/*.d.ts',
  ],
};
