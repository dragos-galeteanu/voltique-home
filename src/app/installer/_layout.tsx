import { RoleTabs, type TabDefinition } from '@/components/role-tabs';
import { RoleGate } from '@/features/auth/role-gate';

const TABS: TabDefinition[] = [
  { name: 'households', titleKey: 'tabs.households', icon: 'home-outline' },
  { name: 'alerts', titleKey: 'tabs.alerts', icon: 'warning-outline' },
  { name: 'settings', titleKey: 'tabs.settings', icon: 'settings-outline' },
];

export default function InstallerLayout() {
  return (
    <RoleGate role="installer">
      <RoleTabs tabs={TABS} />
    </RoleGate>
  );
}
