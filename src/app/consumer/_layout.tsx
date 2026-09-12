import { RoleTabs, type TabDefinition } from '@/components/role-tabs';
import { RoleGate } from '@/features/auth/role-gate';

const TABS: TabDefinition[] = [
  { name: 'dashboard', title: 'Dashboard', icon: 'speedometer-outline' },
  { name: 'assets', title: 'Assets', icon: 'hardware-chip-outline' },
  { name: 'alerts', title: 'Alerts', icon: 'notifications-outline' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline' },
];

export default function ConsumerLayout() {
  return (
    <RoleGate role="consumer">
      <RoleTabs tabs={TABS} />
    </RoleGate>
  );
}
