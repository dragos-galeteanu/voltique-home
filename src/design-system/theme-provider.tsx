import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router';
import { createContext, type ReactNode, use, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './theme';

export type ThemePreference = 'system' | 'light' | 'dark';

const ThemeContext = createContext<Theme>(darkTheme);

export function useTheme(): Theme {
  return use(ThemeContext);
}

/**
 * Builds a stylesheet from the active theme.
 *
 * Pass a factory defined at module scope, not an inline arrow, otherwise the styles
 * are rebuilt on every render.
 */
export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export function resolveTheme(preference: ThemePreference, systemScheme: 'light' | 'dark'): Theme {
  const resolved = preference === 'system' ? systemScheme : preference;
  return resolved === 'dark' ? darkTheme : lightTheme;
}

type ThemeProviderProps = {
  preference?: ThemePreference;
  children: ReactNode;
};

/**
 * Owns the app theme and keeps React Navigation's own theme in step, so headers,
 * tab bars and screen backgrounds cannot drift from the design system.
 */
export function ThemeProvider({ preference = 'system', children }: ThemeProviderProps) {
  const systemScheme = useColorScheme() === 'light' ? 'light' : 'dark';
  const theme = resolveTheme(preference, systemScheme);

  const navigationTheme = useMemo(() => {
    const base = theme.name === 'dark' ? NavigationDarkTheme : NavigationLightTheme;
    return {
      ...base,
      dark: theme.name === 'dark',
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.textPrimary,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme]);

  return (
    <ThemeContext value={theme}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext>
  );
}
