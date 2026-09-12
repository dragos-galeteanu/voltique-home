import type { ConfigContext, ExpoConfig } from 'expo/config';

import { version } from './package.json';

/**
 * Build-time configuration. Everything environment specific is resolved here and
 * handed to the app through `extra`, so the running code reads one validated
 * object (see src/config/env.ts) instead of scattered process.env lookups.
 */
type AppVariant = 'development' | 'staging' | 'production';

const VARIANTS = {
  development: {
    name: 'Voltique Home (Dev)',
    identifier: 'com.voltique.home.dev',
    apiOrigin: 'http://localhost:4010',
  },
  staging: {
    name: 'Voltique Home (Staging)',
    identifier: 'com.voltique.home.staging',
    apiOrigin: 'https://staging.api.voltique.example',
  },
  production: {
    name: 'Voltique Home',
    identifier: 'com.voltique.home',
    apiOrigin: 'https://api.voltique.example',
  },
} as const satisfies Record<AppVariant, { name: string; identifier: string; apiOrigin: string }>;

function resolveVariant(): AppVariant {
  const raw = process.env.APP_VARIANT ?? 'development';
  if (raw in VARIANTS) return raw as AppVariant;
  throw new Error(
    `Unknown APP_VARIANT "${raw}". Expected one of: ${Object.keys(VARIANTS).join(', ')}`,
  );
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const variant = resolveVariant();
  const { name: displayName, identifier, apiOrigin } = VARIANTS[variant];

  return {
    ...config,
    // Kept constant so the generated native project and Xcode scheme do not change
    // per variant. The user-visible label comes from the settings below.
    name: 'Voltique Home',
    slug: 'voltique-home',
    // The marketing version lives in package.json so a release bumps one file.
    version,
    orientation: 'portrait',
    scheme: 'voltique',
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    ios: {
      bundleIdentifier: identifier,
      supportsTablet: false,
      infoPlist: {
        CFBundleDisplayName: displayName,
      },
      buildNumber: process.env.IOS_BUILD_NUMBER ?? '1',
    },
    android: {
      package: identifier,
      versionCode: Number(process.env.ANDROID_VERSION_CODE ?? 1),
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        backgroundColor: '#0B1220',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      ['./plugins/with-android-app-name', { name: displayName }],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0B1220',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      appVariant: variant,
      // The REST prefix is appended by the API client, never hardcoded downstream.
      apiOrigin: process.env.API_ORIGIN ?? apiOrigin,
    },
  };
};
