import type { AssetStatus } from '@/api/generated/endpoints';
import type { StatusTone } from '@/design-system';

/** One mapping from asset status to how it reads and looks, used everywhere. */
export const ASSET_STATUS_PRESENTATION: Record<AssetStatus, { label: string; tone: StatusTone }> = {
  online: { label: 'Online', tone: 'success' },
  offline: { label: 'Offline', tone: 'warning' },
  faulted: { label: 'Faulted', tone: 'danger' },
  commissioning: { label: 'Connecting', tone: 'info' },
  unknown: { label: 'Unknown', tone: 'neutral' },
};
