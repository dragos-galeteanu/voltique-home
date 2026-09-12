import { RoleTabs, type TabDefinition } from '@/components/role-tabs';

const TABS: TabDefinition[] = [
  { name: 'households', titleKey: 'tabs.households', icon: 'home-outline' },
  { name: 'alerts', titleKey: 'tabs.alerts', icon: 'warning-outline' },
  { name: 'settings', titleKey: 'tabs.settings', icon: 'settings-outline' },
];

export default function InstallerTabsLayout() {
  return <RoleTabs tabs={TABS} />;
}
