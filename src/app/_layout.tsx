import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as StoreProvider } from 'react-redux';

import { RouteErrorBoundary } from '@/components/route-error-boundary';
import { ThemeProvider, ToastProvider } from '@/design-system';
import { selectAuthStatus } from '@/features/auth/auth-slice';
import { useSessionRestore } from '@/features/auth/use-session-restore';
import { OfflineBanner } from '@/features/network/offline-banner';
import { useConnectivity } from '@/features/network/use-connectivity';
import { useNotificationTaps } from '@/features/notifications/use-notification-taps';
import { usePushRegistration } from '@/features/notifications/use-push-registration';
import { selectLanguagePreference, selectThemePreference } from '@/features/ui/ui-slice';
import { changeLocale, i18n, resolveDeviceLocale } from '@/i18n';
import { initObservability, Sentry } from '@/observability/sentry';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { selectHydrated } from '@/store/persistence/cache-slice';
import { hydrateAndPersist } from '@/store/persistence/persist';

void SplashScreen.preventAutoHideAsync();

// Before anything renders, so a crash during the first paint is still reported.
initObservability();

// Restores the last snapshot and keeps writing new ones. Started outside React because
// it belongs to the store's lifetime, not to a component's.
void hydrateAndPersist(store);

export { RouteErrorBoundary as ErrorBoundary };

function RootLayout() {
  return (
    <StoreProvider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemedApp />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StoreProvider>
  );
}

/** Wrapped so unhandled render errors reach Sentry with navigation breadcrumbs. */
export default Sentry.wrap(RootLayout);

/**
 * Lives inside the store provider so the theme can follow the user's preference and
 * the splash can be held until the stored session has been read.
 */
function ThemedApp() {
  const preference = useAppSelector(selectThemePreference);
  const language = useAppSelector(selectLanguagePreference);
  const status = useAppSelector(selectAuthStatus);
  const hydrated = useAppSelector(selectHydrated);

  useSessionRestore();
  useConnectivity();
  usePushRegistration();
  useNotificationTaps();

  useEffect(() => {
    void changeLocale(language === 'system' ? resolveDeviceLocale() : language);
  }, [language]);

  useEffect(() => {
    // Held until both the session and the cached data are in place, so the first frame
    // is the real one rather than an empty state that fills in a moment later.
    if (status !== 'restoring' && hydrated) void SplashScreen.hideAsync();
  }, [hydrated, status]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider preference={preference}>
        <ToastProvider>
          <StatusBar style="auto" />
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }} />
        </ToastProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
