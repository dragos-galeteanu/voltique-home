import type {
  Alert,
  Asset,
  Device,
  Household,
  Invite,
  Member,
  Session,
  User,
} from '@/api/generated/endpoints';

import { fixtureBodies } from './generated/fixtures';

/**
 * The state a mocked backend holds between requests.
 *
 * Seeded from the contract's own examples, then changed by writes, so acknowledging an
 * alert or adding an asset behaves the way it will against the real API instead of
 * snapping back on the next refetch.
 */
export type World = {
  user: User;
  households: Household[];
  members: Member[];
  invites: Invite[];
  assets: Asset[];
  alerts: Alert[];
  devices: Device[];
  /**
   * The account's password, so sign-in, deletion and a password reset can be exercised
   * against something rather than accepting anything.
   */
  password: string;
  /** Reset links handed out by this session, so confirming one can fail convincingly. */
  resetTokens: string[];
  /** Every request fails with this status, for exercising error states. */
  failWith: number | null;
  /** Artificial delay, for seeing loading states that are otherwise instant. */
  latencyMs: number;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function page<T>(body: unknown): T[] {
  const data = (body as { data?: T[] } | undefined)?.data;
  return data ? clone(data) : [];
}

/** A fresh world, seeded from the contract examples. */
export function createWorld(): World {
  const session = fixtureBodies.signIn as Session | undefined;

  return {
    user: clone(session?.user ?? (fixtureBodies.getCurrentUser as User)),
    households: page<Household>(fixtureBodies.listHouseholds),
    members: page<Member>(fixtureBodies.listHouseholdMembers),
    invites: page<Invite>(fixtureBodies.listHouseholdInvites),
    assets: page<Asset>(fixtureBodies.listHouseholdAssets),
    alerts: page<Alert>(fixtureBodies.listAlerts),
    devices: clone((fixtureBodies.listDevices as Device[] | undefined) ?? []),
    password: 'password1',
    resetTokens: [],
    failWith: null,
    latencyMs: 0,
  };
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Alerts seeded from the cross-household example carry a household that is not ours. */
export function alertsForHousehold(world: World, householdId: string): Alert[] {
  return world.alerts.filter((alert) => alert.householdId === householdId);
}

export function assetsForHousehold(world: World, householdId: string): Asset[] {
  return world.assets.filter((asset) => asset.householdId === householdId);
}
