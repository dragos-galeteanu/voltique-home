import { RoleTabs, type TabDefinition } from '@/components/role-tabs';
import { RoleGate } from '@/features/auth/role-gate';

const TABS: TabDefinition[] = [
  { name: 'households', title: 'Households', icon: 'home-outline' },
  { name: 'alerts', title: 'Alerts', icon: 'warning-outline' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline' },
];

export default function InstallerLayout() {
  return (
    <RoleGate role="installer">
      <RoleTabs tabs={TABS} />
    </RoleGate>
  );
}
