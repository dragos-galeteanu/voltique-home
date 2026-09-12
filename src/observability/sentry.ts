import * as Sentry from '@sentry/react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { env, isDevelopment } from '@/config/env';

/**
 * Crash and error reporting.
 *
 * Off unless a DSN is configured, so a fork or a local checkout reports nothing by
 * accident. Also off inside Expo Go, where the native layer Sentry needs is not present.
 */
export function initObservability(): void {
  const runningInExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (!env.sentryDsn || runningInExpoGo) return;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appVariant,
    // Matches what the release lane uploads source maps against.
    release: `${env.appVersion}+${env.buildNumber}`,
    dist: env.buildNumber,
    // Errors always; traces only on a small sample, since this is a monitoring app that
    // polls and would otherwise send a lot of uninteresting spans.
    tracesSampleRate: isDevelopment ? 1 : 0.1,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
  });
}

/**
 * Reports something that went wrong but was handled, so it does not disappear into a
 * toast. Safe to call when Sentry was never initialised.
 */
export function reportHandledError(error: unknown, context?: Record<string, unknown>): void {
  if (!env.sentryDsn) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export { Sentry };
