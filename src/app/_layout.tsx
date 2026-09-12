import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as StoreProvider } from 'react-redux';

import { RouteErrorBoundary } from '@/components/route-error-boundary';
import { ThemeProvider, ToastProvider } from '@/design-system';
import { selectAuthStatus } from '@/features/auth/auth-slice';
import { useSessionRestore } from '@/features/auth/use-session-restore';
import { selectLanguagePreference, selectThemePreference } from '@/features/ui/ui-slice';
import { changeLocale, resolveDeviceLocale } from '@/i18n';
import { initObservability, Sentry } from '@/observability/sentry';
import { store } from '@/store';
import { useAppSelector } from '@/store/hooks';

void SplashScreen.preventAutoHideAsync();

// Before anything renders, so a crash during the first paint is still reported.
initObservability();

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

  useSessionRestore();

  useEffect(() => {
    void changeLocale(language === 'system' ? resolveDeviceLocale() : language);
  }, [language]);

  useEffect(() => {
    if (status !== 'restoring') void SplashScreen.hideAsync();
  }, [status]);

  return (
    <ThemeProvider preference={preference}>
      <ToastProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </ThemeProvider>
  );
}
