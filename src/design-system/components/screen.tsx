import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme-provider';

export type ScreenProps = {
  children: ReactNode;
  /** Wraps content in a ScrollView. Off for screens that own their own list. */
  scrollable?: boolean;
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Screen-level container: theme background, safe area and consistent gutters.
 */
export function Screen({
  children,
  scrollable = false,
  edges = ['top', 'left', 'right'],
  contentStyle,
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const padding = { padding: theme.spacing.lg, gap: theme.spacing.lg };

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[padding, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padding, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
