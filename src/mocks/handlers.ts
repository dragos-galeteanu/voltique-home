import type { Alert, Asset, Device, Household, Invite } from '@/api/generated/endpoints';

import { fixtureBodies } from './generated/fixtures';
import { alertsForHousehold, assetsForHousehold, newId, type World } from './world';

export type MockRequest = {
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown> | undefined;
};

export type MockResponse = { status: number; body?: unknown };

export type Handler = (world: World, request: MockRequest) => MockResponse;

const ok = (body?: unknown): MockResponse => ({ status: 200, body });
const created = (body: unknown): MockResponse => ({ status: 201, body });
const noContent = (): MockResponse => ({ status: 204 });
const notFound = (): MockResponse => ({
  status: 404,
  body: { title: 'Not found', status: 404, code: 'resource_not_found' },
});

function paged<T>(items: T[], query: URLSearchParams): MockResponse {
  const limit = Number(query.get('limit') ?? 0);
  const data = limit > 0 ? items.slice(0, limit) : items;
  return ok({ data, nextCursor: null });
}

/**
 * Only operations whose answer depends on state, or that change it, need a handler here.
 * Everything else falls through to the example in the contract, which is what keeps this
 * file from growing into a second implementation of the backend.
 */
export const handlers: Record<string, Handler> = {
  // --- session ---------------------------------------------------------------
  signIn: (world, { body }) => {
    const email = typeof body?.email === 'string' ? body.email : world.user.email;
    world.user = {
      ...world.user,
      email,
      displayName: email.split('@')[0] ?? world.user.displayName,
    };
    return created({ user: world.user, tokens: fixtureBodies.refreshSession });
  },
  getCurrentUser: (world) => ok(world.user),

  // --- households ------------------------------------------------------------
  listHouseholds: (world, { query }) => paged(world.households, query),
  getHousehold: (world, { params }) => {
    const household = world.households.find((entry) => entry.id === params.householdId);
    return household ? ok(household) : notFound();
  },
  createHousehold: (world, { body }) => {
    const household: Household = {
      id: newId('household'),
      name: String(body?.name ?? 'New household'),
      timezone: String(body?.timezone ?? 'UTC'),
      membershipRole: 'owner',
      assetCount: 0,
      openAlertCount: 0,
      createdAt: new Date().toISOString(),
    };
    world.households = [...world.households, household];
    return created(household);
  },
  updateHousehold: (world, { params, body }) => {
    const household = world.households.find((entry) => entry.id === params.householdId);
    if (!household) return notFound();

    Object.assign(household, {
      name: body?.name ?? household.name,
      timezone: body?.timezone ?? household.timezone,
    });
    return ok(household);
  },
  deleteHousehold: (world, { params }) => {
    world.households = world.households.filter((entry) => entry.id !== params.householdId);
    return noContent();
  },

  // --- people ----------------------------------------------------------------
  listHouseholdMembers: (world, { query }) => paged(world.members, query),
  removeHouseholdMember: (world, { params }) => {
    world.members = world.members.filter((member) => member.userId !== params.userId);
    return noContent();
  },
  listHouseholdInvites: (world, { params, query }) => {
    const status = query.get('status');
    const invites = world.invites.filter(
      (invite) =>
        invite.householdId === params.householdId && (!status || invite.status === status),
    );
    return paged(invites, query);
  },
  createHouseholdInvite: (world, { params, body }) => {
    const invite: Invite = {
      id: newId('invite'),
      householdId: String(params.householdId),
      email: String(body?.email ?? 'someone@example.com'),
      membershipRole: (body?.membershipRole as Invite['membershipRole']) ?? 'installer',
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    };
    world.invites = [...world.invites, invite];
    return created(invite);
  },
  revokeInvite: (world, { params }) => {
    world.invites = world.invites.filter((invite) => invite.id !== params.inviteId);
    return noContent();
  },
  acceptInvite: (world) => ok(world.households[0] ?? notFound().body),

  // --- assets ----------------------------------------------------------------
  listHouseholdAssets: (world, { params, query }) => {
    const status = query.get('status');
    const assets = assetsForHousehold(world, String(params.householdId)).filter(
      (asset) => !status || asset.status === status,
    );
    return paged(assets, query);
  },
  getAsset: (world, { params }) => {
    const asset = world.assets.find((entry) => entry.id === params.assetId);
    return asset ? ok(asset) : notFound();
  },
  createHouseholdAsset: (world, { params, body }) => {
    const asset: Asset = {
      id: newId('asset'),
      householdId: String(params.householdId),
      name: String(body?.name ?? 'New asset'),
      assetTypeId: String(body?.assetTypeId ?? 'solar_inverter'),
      manufacturerId: String(body?.manufacturerId ?? 'sunra'),
      modelId: String(body?.modelId ?? 'sunra-x7'),
      category: 'production',
      // Exactly what the real API does: nothing has been read from it yet.
      status: 'commissioning',
      createdAt: new Date().toISOString(),
    };
    world.assets = [...world.assets, asset];
    return created(asset);
  },
  updateAsset: (world, { params, body }) => {
    const asset = world.assets.find((entry) => entry.id === params.assetId);
    if (!asset) return notFound();

    if (typeof body?.name === 'string') asset.name = body.name;
    return ok(asset);
  },
  deleteAsset: (world, { params }) => {
    world.assets = world.assets.filter((asset) => asset.id !== params.assetId);
    return noContent();
  },

  // --- alerts ----------------------------------------------------------------
  listHouseholdAlerts: (world, { params, query }) => {
    const status = query.get('status');
    const severity = query.get('severity');
    const alerts = alertsForHousehold(world, String(params.householdId)).filter(
      (alert) => (!status || alert.status === status) && (!severity || alert.severity === severity),
    );
    return paged(alerts, query);
  },
  listAlerts: (world, { query }) => {
    const status = query.get('status');
    const householdId = query.get('householdId');
    const alerts = world.alerts.filter(
      (alert) =>
        (!status || alert.status === status) && (!householdId || alert.householdId === householdId),
    );
    return paged(alerts, query);
  },
  getAlert: (world, { params }) => {
    const alert = world.alerts.find((entry) => entry.id === params.alertId);
    return alert ? ok(alert) : notFound();
  },
  updateAlertStatus: (world, { params, body }) => {
    const alert = world.alerts.find((entry) => entry.id === params.alertId);
    if (!alert) return notFound();

    const status = body?.status as Alert['status'] | undefined;
    if (status) {
      alert.status = status;
      if (status === 'acknowledged') alert.acknowledgedAt = new Date().toISOString();
      if (status === 'resolved') alert.resolvedAt = new Date().toISOString();
    }
    return ok(alert);
  },

  // --- devices ---------------------------------------------------------------
  listDevices: (world) => ok(world.devices),
  registerDevice: (world, { body }) => {
    const device: Device = {
      id: world.devices[0]?.id ?? newId('device'),
      platform: (body?.platform as Device['platform']) ?? 'ios',
      label: typeof body?.label === 'string' ? body.label : 'This device',
      notifications: (body?.notifications as Device['notifications']) ?? {
        enabled: true,
        minSeverity: 'warning',
      },
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    world.devices = [device];
    return ok(device);
  },
  updateDeviceNotifications: (world, { params, body }) => {
    const device = world.devices.find((entry) => entry.id === params.deviceId);
    if (!device) return notFound();

    device.notifications = body as Device['notifications'];
    return ok(device);
  },
  unregisterDevice: (world, { params }) => {
    world.devices = world.devices.filter((device) => device.id !== params.deviceId);
    return noContent();
  },
};
