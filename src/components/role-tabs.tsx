import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/design-system';

export type TabDefinition = {
  name: string;
  /** Translation key, resolved here so the tab bar follows the active language. */
  titleKey: 'tabs.dashboard' | 'tabs.assets' | 'tabs.alerts' | 'tabs.settings' | 'tabs.households';
  icon: keyof typeof Ionicons.glyphMap;
  /** Shown on the tab when greater than zero. */
  badgeCount?: number;
};

/**
 * One tab bar implementation for both roles, themed from the design system so the
 * shells cannot drift apart.
 */
export function RoleTabs({ tabs }: { tabs: TabDefinition[] }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: theme.typography.caption,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarButtonTestID: `tab-${tab.name}`,
            tabBarBadge: tab.badgeCount && tab.badgeCount > 0 ? tab.badgeCount : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
