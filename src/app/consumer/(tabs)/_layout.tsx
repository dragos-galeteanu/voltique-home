import { RoleTabs, type TabDefinition } from '@/components/role-tabs';
import { useOpenAlertCount } from '@/features/alerts/use-open-alert-count';

export default function ConsumerTabsLayout() {
  // Lives here rather than on the alerts screen so the badge is right wherever you are.
  const openAlerts = useOpenAlertCount();

  const tabs: TabDefinition[] = [
    { name: 'dashboard', titleKey: 'tabs.dashboard', icon: 'speedometer-outline' },
    { name: 'assets', titleKey: 'tabs.assets', icon: 'hardware-chip-outline' },
    {
      name: 'alerts',
      titleKey: 'tabs.alerts',
      icon: 'notifications-outline',
      badgeCount: openAlerts,
    },
    { name: 'settings', titleKey: 'tabs.settings', icon: 'settings-outline' },
  ];

  return <RoleTabs tabs={tabs} />;
}
