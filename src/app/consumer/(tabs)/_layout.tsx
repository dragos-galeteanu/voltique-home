import { RoleTabs, type TabDefinition } from '@/components/role-tabs';

const TABS: TabDefinition[] = [
  { name: 'dashboard', titleKey: 'tabs.dashboard', icon: 'speedometer-outline' },
  { name: 'assets', titleKey: 'tabs.assets', icon: 'hardware-chip-outline' },
  { name: 'alerts', titleKey: 'tabs.alerts', icon: 'notifications-outline' },
  { name: 'settings', titleKey: 'tabs.settings', icon: 'settings-outline' },
];

export default function ConsumerTabsLayout() {
  return <RoleTabs tabs={TABS} />;
}
