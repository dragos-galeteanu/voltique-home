import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as StoreProvider } from 'react-redux';

import { api } from '@/api/api';
import { ThemeProvider } from '@/design-system';
import { i18n } from '@/i18n';
import { type AppStore, createStore } from '@/store/create-store';

const created: AppStore[] = [];

/**
 * RTK Query schedules a timer to drop unused cache entries. Without this the timer
 * fires after Jest has torn the environment down and reports a spurious error.
 */
afterEach(() => {
  created.forEach((store) => store.dispatch(api.util.resetApiState()));
  created.length = 0;
});

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * Renders with the providers a screen actually depends on, and hands back the store so
 * a test can assert what a user's action changed.
 *
 * Awaited, because React Native Testing Library v14 renders asynchronously. So does
 * fireEvent, so tests must await both.
 *
 * The toast provider is deliberately left out: its context defaults to no-ops, and
 * including it would drag Reanimated into every component test.
 */
export async function renderWithProviders(
  ui: ReactElement,
  { store = createStore(), ...options }: { store?: AppStore } & RenderOptions = {},
) {
  created.push(store);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <StoreProvider store={store}>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider initialMetrics={METRICS}>
            <ThemeProvider preference="dark">{children}</ThemeProvider>
          </SafeAreaProvider>
        </I18nextProvider>
      </StoreProvider>
    );
  }

  return { store, ...(await render(ui, { wrapper: Wrapper, ...options })) };
}
