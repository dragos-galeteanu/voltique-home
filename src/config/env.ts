import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Every REST route the API exposes lives under this prefix. The API client adds
 * it once, so endpoint definitions stay version agnostic.
 */
export const API_PATH_PREFIX = '/api/v1';

const appExtraSchema = z.object({
  appVariant: z.enum(['development', 'staging', 'production']),
  apiOrigin: z.url(),
  appVersion: z.string(),
  buildNumber: z.string(),
  /** Absent means crash reporting stays off, which is the case for a local checkout. */
  sentryDsn: z.string().optional(),
  /** Needed to mint an Expo push token. Absent in a local checkout, where push is off. */
  easProjectId: z.string().optional(),
});

type AppExtra = z.infer<typeof appExtraSchema>;

export type AppEnv = AppExtra & {
  /** Origin plus the versioned REST prefix, with no trailing slash. */
  apiBaseUrl: string;
};

function readEnv(): AppEnv {
  const result = appExtraSchema.safeParse(Constants.expoConfig?.extra);

  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(
      `Invalid app configuration in app.config.ts "extra" (${detail}). ` +
        'Rebuild after fixing, since extra is resolved at build time.',
    );
  }

  const origin = result.data.apiOrigin.replace(/\/+$/, '');

  return {
    ...result.data,
    apiBaseUrl: `${origin}${API_PATH_PREFIX}`,
  };
}

export const env: AppEnv = readEnv();

export const isDevelopment = env.appVariant === 'development';
