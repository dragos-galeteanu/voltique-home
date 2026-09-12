import type { AssetStatus } from '@/api/generated/endpoints';
import type { StatusTone } from '@/design-system';

/**
 * One mapping from asset status to how it reads and looks, used everywhere. The label
 * is a translation key rather than text, so the mapping stays language independent.
 */
export const ASSET_STATUS_PRESENTATION: Record<
  AssetStatus,
  { labelKey: `assets.status.${AssetStatus}`; tone: StatusTone }
> = {
  online: { labelKey: 'assets.status.online', tone: 'success' },
  offline: { labelKey: 'assets.status.offline', tone: 'warning' },
  faulted: { labelKey: 'assets.status.faulted', tone: 'danger' },
  commissioning: { labelKey: 'assets.status.commissioning', tone: 'info' },
  unknown: { labelKey: 'assets.status.unknown', tone: 'neutral' },
};
