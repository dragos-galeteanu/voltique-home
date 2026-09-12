import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme-provider';
import type { SpacingToken } from '../tokens';

export type SurfaceProps = {
  children: ReactNode;
  padding?: SpacingToken;
  gap?: SpacingToken;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A bordered panel. The building block for cards, list groups and metric tiles. */
export function Surface({
  children,
  padding = 'lg',
  gap = 'md',
  elevated = false,
  style,
  testID,
}: SurfaceProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: elevated ? theme.colors.surfaceElevated : theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          padding: theme.spacing[padding],
          gap: theme.spacing[gap],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
