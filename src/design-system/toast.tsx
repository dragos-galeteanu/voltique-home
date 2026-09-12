import { createContext, type ReactNode, use, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './components/text';
import { useTheme } from './theme-provider';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

export type Toast = {
  message: string;
  tone?: ToastTone;
  /** Milliseconds before it dismisses itself. */
  duration?: number;
};

type ToastContextValue = {
  showToast: (toast: Toast) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  dismissToast: () => {},
});

/**
 * App-wide transient feedback. API failures surface here, so screens do not each
 * invent their own error banner.
 */
export function useToast(): ToastContextValue {
  return use(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback(
    (next: Toast) => {
      if (timeout.current) clearTimeout(timeout.current);
      setToast(next);
      timeout.current = setTimeout(dismissToast, next.duration ?? 4000);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [dismissToast, showToast]);

  return (
    <ToastContext value={value}>
      {children}
      {toast ? <ToastView toast={toast} /> : null}
    </ToastContext>
  );
}

function ToastView({ toast }: { toast: Toast }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const accent = {
    info: theme.colors.info,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  }[toast.tone ?? 'info'];

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      entering={FadeInDown.duration(theme.motion.base)}
      exiting={FadeOutDown.duration(theme.motion.fast)}
      pointerEvents="box-none"
      testID="toast"
      style={[
        styles.container,
        {
          bottom: insets.bottom + theme.spacing.xl,
          marginHorizontal: theme.spacing.lg,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
            borderLeftColor: accent,
            borderRadius: theme.radius.md,
            gap: theme.spacing.md,
            padding: theme.spacing.lg,
          },
        ]}
      >
        <Text variant="label">{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 3,
  },
});
