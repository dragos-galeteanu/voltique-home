import { api } from '../api';
export const addTagTypes = [
  'Auth',
  'CurrentUser',
  'Household',
  'Member',
  'Invite',
  'AssetCatalogue',
  'Asset',
  'Telemetry',
  'Log',
  'Alert',
] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      signIn: build.mutation<SignInApiResponse, SignInApiArg>({
        query: (queryArg) => ({
          url: `/auth/sessions`,
          method: 'POST',
          body: queryArg.signInRequest,
        }),
        invalidatesTags: ['Auth'],
      }),
      refreshSession: build.mutation<RefreshSessionApiResponse, RefreshSessionApiArg>({
        query: (queryArg) => ({
          url: `/auth/sessions/refresh`,
          method: 'POST',
          body: queryArg.refreshRequest,
        }),
        invalidatesTags: ['Auth'],
      }),
      signOut: build.mutation<SignOutApiResponse, SignOutApiArg>({
        query: () => ({ url: `/auth/sessions/current`, method: 'DELETE' }),
        invalidatesTags: ['Auth'],
      }),
      getCurrentUser: build.query<GetCurrentUserApiResponse, GetCurrentUserApiArg>({
        query: () => ({ url: `/users/me` }),
        providesTags: ['CurrentUser'],
      }),
      listHouseholds: build.query<ListHouseholdsApiResponse, ListHouseholdsApiArg>({
        query: (queryArg) => ({
          url: `/households`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Household'],
      }),
      createHousehold: build.mutation<CreateHouseholdApiResponse, CreateHouseholdApiArg>({
        query: (queryArg) => ({
          url: `/households`,
          method: 'POST',
          body: queryArg.householdCreate,
        }),
        invalidatesTags: ['Household'],
      }),
      getHousehold: build.query<GetHouseholdApiResponse, GetHouseholdApiArg>({
        query: (queryArg) => ({ url: `/households/${queryArg.householdId}` }),
        providesTags: ['Household'],
      }),
      updateHousehold: build.mutation<UpdateHouseholdApiResponse, UpdateHouseholdApiArg>({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}`,
          method: 'PATCH',
          body: queryArg.householdUpdate,
        }),
        invalidatesTags: ['Household'],
      }),
      deleteHousehold: build.mutation<DeleteHouseholdApiResponse, DeleteHouseholdApiArg>({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Household'],
      }),
      listHouseholdMembers: build.query<
        ListHouseholdMembersApiResponse,
        ListHouseholdMembersApiArg
      >({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/members`,
          params: {
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Member'],
      }),
      removeHouseholdMember: build.mutation<
        RemoveHouseholdMemberApiResponse,
        RemoveHouseholdMemberApiArg
      >({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/members/${queryArg.userId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Member'],
      }),
      listHouseholdInvites: build.query<
        ListHouseholdInvitesApiResponse,
        ListHouseholdInvitesApiArg
      >({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/invites`,
          params: {
            status: queryArg.status,
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Invite'],
      }),
      createHouseholdInvite: build.mutation<
        CreateHouseholdInviteApiResponse,
        CreateHouseholdInviteApiArg
      >({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/invites`,
          method: 'POST',
          body: queryArg.inviteCreate,
        }),
        invalidatesTags: ['Invite'],
      }),
      revokeInvite: build.mutation<RevokeInviteApiResponse, RevokeInviteApiArg>({
        query: (queryArg) => ({
          url: `/invites/${queryArg.inviteId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Invite'],
      }),
      acceptInvite: build.mutation<AcceptInviteApiResponse, AcceptInviteApiArg>({
        query: (queryArg) => ({
          url: `/invites/${queryArg.token}/accept`,
          method: 'POST',
        }),
        invalidatesTags: ['Invite'],
      }),
      listAssetTypes: build.query<ListAssetTypesApiResponse, ListAssetTypesApiArg>({
        query: () => ({ url: `/asset-types` }),
        providesTags: ['AssetCatalogue'],
      }),
      listManufacturers: build.query<ListManufacturersApiResponse, ListManufacturersApiArg>({
        query: (queryArg) => ({
          url: `/manufacturers`,
          params: {
            assetTypeId: queryArg.assetTypeId,
          },
        }),
        providesTags: ['AssetCatalogue'],
      }),
      listManufacturerModels: build.query<
        ListManufacturerModelsApiResponse,
        ListManufacturerModelsApiArg
      >({
        query: (queryArg) => ({
          url: `/manufacturers/${queryArg.manufacturerId}/models`,
        }),
        providesTags: ['AssetCatalogue'],
      }),
      listHouseholdAssets: build.query<ListHouseholdAssetsApiResponse, ListHouseholdAssetsApiArg>({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/assets`,
          params: {
            status: queryArg.status,
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Asset'],
      }),
      createHouseholdAsset: build.mutation<
        CreateHouseholdAssetApiResponse,
        CreateHouseholdAssetApiArg
      >({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/assets`,
          method: 'POST',
          body: queryArg.assetCreate,
        }),
        invalidatesTags: ['Asset'],
      }),
      getAsset: build.query<GetAssetApiResponse, GetAssetApiArg>({
        query: (queryArg) => ({ url: `/assets/${queryArg.assetId}` }),
        providesTags: ['Asset'],
      }),
      updateAsset: build.mutation<UpdateAssetApiResponse, UpdateAssetApiArg>({
        query: (queryArg) => ({
          url: `/assets/${queryArg.assetId}`,
          method: 'PATCH',
          body: queryArg.assetUpdate,
        }),
        invalidatesTags: ['Asset'],
      }),
      deleteAsset: build.mutation<DeleteAssetApiResponse, DeleteAssetApiArg>({
        query: (queryArg) => ({
          url: `/assets/${queryArg.assetId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Asset'],
      }),
      getAssetTelemetry: build.query<GetAssetTelemetryApiResponse, GetAssetTelemetryApiArg>({
        query: (queryArg) => ({
          url: `/assets/${queryArg.assetId}/telemetry`,
          params: {
            from: queryArg['from'],
            to: queryArg.to,
            resolution: queryArg.resolution,
            metrics: queryArg.metrics,
          },
        }),
        providesTags: ['Telemetry'],
      }),
      getHouseholdTelemetry: build.query<
        GetHouseholdTelemetryApiResponse,
        GetHouseholdTelemetryApiArg
      >({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/telemetry`,
          params: {
            from: queryArg['from'],
            to: queryArg.to,
            resolution: queryArg.resolution,
            metrics: queryArg.metrics,
          },
        }),
        providesTags: ['Telemetry'],
      }),
      listAssetLogs: build.query<ListAssetLogsApiResponse, ListAssetLogsApiArg>({
        query: (queryArg) => ({
          url: `/assets/${queryArg.assetId}/logs`,
          params: {
            severity: queryArg.severity,
            from: queryArg['from'],
            to: queryArg.to,
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Log'],
      }),
      listHouseholdAlerts: build.query<ListHouseholdAlertsApiResponse, ListHouseholdAlertsApiArg>({
        query: (queryArg) => ({
          url: `/households/${queryArg.householdId}/alerts`,
          params: {
            status: queryArg.status,
            severity: queryArg.severity,
            assetId: queryArg.assetId,
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Alert'],
      }),
      listAlerts: build.query<ListAlertsApiResponse, ListAlertsApiArg>({
        query: (queryArg) => ({
          url: `/alerts`,
          params: {
            status: queryArg.status,
            severity: queryArg.severity,
            householdId: queryArg.householdId,
            cursor: queryArg.cursor,
            limit: queryArg.limit,
          },
        }),
        providesTags: ['Alert'],
      }),
      getAlert: build.query<GetAlertApiResponse, GetAlertApiArg>({
        query: (queryArg) => ({ url: `/alerts/${queryArg.alertId}` }),
        providesTags: ['Alert'],
      }),
      updateAlertStatus: build.mutation<UpdateAlertStatusApiResponse, UpdateAlertStatusApiArg>({
        query: (queryArg) => ({
          url: `/alerts/${queryArg.alertId}`,
          method: 'PATCH',
          body: queryArg.alertStatusUpdate,
        }),
        invalidatesTags: ['Alert'],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as voltiqueApi };
export type SignInApiResponse = /** status 201 Session created */ Session;
export type SignInApiArg = {
  signInRequest: SignInRequest;
};
export type RefreshSessionApiResponse = /** status 200 New token pair */ AuthTokens;
export type RefreshSessionApiArg = {
  refreshRequest: RefreshRequest;
};
export type SignOutApiResponse = unknown;
export type SignOutApiArg = void;
export type GetCurrentUserApiResponse = /** status 200 The signed-in user */ User;
export type GetCurrentUserApiArg = void;
export type ListHouseholdsApiResponse = /** status 200 A page of households */ HouseholdPage;
export type ListHouseholdsApiArg = {
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type CreateHouseholdApiResponse = /** status 201 Household created */ Household;
export type CreateHouseholdApiArg = {
  householdCreate: HouseholdCreate;
};
export type GetHouseholdApiResponse = /** status 200 The household */ Household;
export type GetHouseholdApiArg = {
  householdId: string;
};
export type UpdateHouseholdApiResponse = /** status 200 The updated household */ Household;
export type UpdateHouseholdApiArg = {
  householdId: string;
  householdUpdate: HouseholdUpdate;
};
export type DeleteHouseholdApiResponse = unknown;
export type DeleteHouseholdApiArg = {
  householdId: string;
};
export type ListHouseholdMembersApiResponse = /** status 200 A page of members */ MemberPage;
export type ListHouseholdMembersApiArg = {
  householdId: string;
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type RemoveHouseholdMemberApiResponse = unknown;
export type RemoveHouseholdMemberApiArg = {
  householdId: string;
  userId: string;
};
export type ListHouseholdInvitesApiResponse = /** status 200 A page of invites */ InvitePage;
export type ListHouseholdInvitesApiArg = {
  householdId: string;
  status?: InviteStatus;
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type CreateHouseholdInviteApiResponse = /** status 201 Invite created */ Invite;
export type CreateHouseholdInviteApiArg = {
  householdId: string;
  inviteCreate: InviteCreate;
};
export type RevokeInviteApiResponse = unknown;
export type RevokeInviteApiArg = {
  inviteId: string;
};
export type AcceptInviteApiResponse =
  /** status 200 The household the caller now has access to */ Household;
export type AcceptInviteApiArg = {
  /** Opaque token from the invitation link. */
  token: string;
};
export type ListAssetTypesApiResponse = /** status 200 Asset types */ AssetType[];
export type ListAssetTypesApiArg = void;
export type ListManufacturersApiResponse = /** status 200 Manufacturers */ Manufacturer[];
export type ListManufacturersApiArg = {
  assetTypeId?: string;
};
export type ListManufacturerModelsApiResponse = /** status 200 Models */ AssetModel[];
export type ListManufacturerModelsApiArg = {
  manufacturerId: string;
};
export type ListHouseholdAssetsApiResponse = /** status 200 A page of assets */ AssetPage;
export type ListHouseholdAssetsApiArg = {
  householdId: string;
  status?: AssetStatus;
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type CreateHouseholdAssetApiResponse = /** status 201 Asset added */ Asset;
export type CreateHouseholdAssetApiArg = {
  householdId: string;
  assetCreate: AssetCreate;
};
export type GetAssetApiResponse = /** status 200 The asset */ Asset;
export type GetAssetApiArg = {
  assetId: string;
};
export type UpdateAssetApiResponse = /** status 200 The updated asset */ Asset;
export type UpdateAssetApiArg = {
  assetId: string;
  assetUpdate: AssetUpdate;
};
export type DeleteAssetApiResponse = unknown;
export type DeleteAssetApiArg = {
  assetId: string;
};
export type GetAssetTelemetryApiResponse =
  /** status 200 Series for the requested window */ TelemetryResponse;
export type GetAssetTelemetryApiArg = {
  assetId: string;
  /** Start of the window, inclusive. */
  from: string;
  /** End of the window, exclusive. */
  to: string;
  resolution: Resolution;
  /** Metrics to return. Defaults to every metric the asset reports. */
  metrics?: AssetMetric[];
};
export type GetHouseholdTelemetryApiResponse =
  /** status 200 Series for the requested window */ TelemetryResponse;
export type GetHouseholdTelemetryApiArg = {
  householdId: string;
  /** Start of the window, inclusive. */
  from: string;
  /** End of the window, exclusive. */
  to: string;
  resolution: Resolution;
  metrics?: HouseholdMetric[];
};
export type ListAssetLogsApiResponse = /** status 200 A page of log entries */ LogEntryPage;
export type ListAssetLogsApiArg = {
  assetId: string;
  /** Minimum severity to return. */
  severity?: LogSeverity;
  /** Start of the window, inclusive. Optional when browsing logs. */
  from?: string;
  /** End of the window, exclusive. Optional when browsing logs. */
  to?: string;
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type ListHouseholdAlertsApiResponse = /** status 200 A page of alerts */ AlertPage;
export type ListHouseholdAlertsApiArg = {
  householdId: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  assetId?: string;
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type ListAlertsApiResponse = /** status 200 A page of alerts */ AlertPage;
export type ListAlertsApiArg = {
  status?: AlertStatus;
  severity?: AlertSeverity;
  householdId?: string;
  /** Opaque cursor from the previous page's `nextCursor`. */
  cursor?: string;
  limit?: number;
};
export type GetAlertApiResponse = /** status 200 The alert */ Alert;
export type GetAlertApiArg = {
  alertId: string;
};
export type UpdateAlertStatusApiResponse = /** status 200 The updated alert */ Alert;
export type UpdateAlertStatusApiArg = {
  alertId: string;
  alertStatusUpdate: AlertStatusUpdate;
};
export type UserRole = 'consumer' | 'installer';
export type User = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
};
export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  /** Lifetime of the access token in seconds. */
  expiresIn: number;
};
export type Session = {
  user: User;
  tokens: AuthTokens;
};
export type ProblemDetails = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  /** Stable machine-readable identifier. The app maps this to user-facing copy and
    to retry behaviour, so it must not change once published.
     */
  code?: string;
  instance?: string;
};
export type SignInRequest = {
  email: string;
  password: string;
};
export type RefreshRequest = {
  refreshToken: string;
};
export type PageMeta = {
  /** Cursor for the next page, or null on the last page. */
  nextCursor: string | null;
};
export type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
};
export type MembershipRole = 'owner' | 'resident' | 'installer';
export type Household = {
  id: string;
  name: string;
  /** IANA zone, used for daily and monthly aggregation boundaries. */
  timezone: string;
  address?: Address;
  membershipRole: MembershipRole;
  assetCount: number;
  openAlertCount?: number;
  createdAt: string;
};
export type HouseholdPage = PageMeta & {
  data: Household[];
};
export type HouseholdCreate = {
  name: string;
  timezone: string;
  address?: Address;
};
export type HouseholdUpdate = {
  name?: string;
  timezone?: string;
  address?: Address;
};
export type Member = {
  userId: string;
  displayName: string;
  email: string;
  membershipRole: MembershipRole;
  joinedAt: string;
};
export type MemberPage = PageMeta & {
  data: Member[];
};
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type Invite = {
  id: string;
  householdId: string;
  email: string;
  membershipRole: MembershipRole;
  status: InviteStatus;
  invitedByUserId?: string;
  createdAt: string;
  expiresAt: string;
};
export type InvitePage = PageMeta & {
  data: Invite[];
};
export type InviteCreate = {
  email: string;
  membershipRole: MembershipRole;
  message?: string;
};
export type AssetCategory = 'production' | 'consumption' | 'storage' | 'bidirectional';
export type AssetMetric = 'power' | 'energy' | 'stateOfCharge' | 'temperature';
export type AssetType = {
  id: string;
  name: string;
  category: AssetCategory;
  metrics: AssetMetric[];
};
export type Manufacturer = {
  id: string;
  name: string;
  assetTypeIds: string[];
  logoUrl?: string;
};
export type ConnectionParameterType = 'text' | 'password' | 'number' | 'select';
export type ConnectionParameter = {
  key: string;
  label: string;
  type: ConnectionParameterType;
  required: boolean;
  helpText?: string;
  /** Regular expression the value must match. */
  pattern?: string;
  /** Present when type is `select`. */
  options?: {
    value: string;
    label: string;
  }[];
};
export type AssetModel = {
  id: string;
  manufacturerId: string;
  assetTypeId: string;
  name: string;
  ratedPowerW?: number;
  capacityWh?: number;
  connectionParameters: ConnectionParameter[];
};
export type AssetStatus = 'commissioning' | 'online' | 'offline' | 'faulted' | 'unknown';
export type AssetReading = {
  powerW?: number;
  energyTodayWh?: number;
  stateOfChargePercent?: number;
  measuredAt?: string;
};
export type Asset = {
  id: string;
  householdId: string;
  name: string;
  assetTypeId: string;
  manufacturerId: string;
  modelId: string;
  category: AssetCategory;
  status: AssetStatus;
  serialNumber?: string;
  ratedPowerW?: number;
  capacityWh?: number;
  lastSeenAt?: string;
  latestReading?: AssetReading;
  openAlertCount?: number;
  createdAt: string;
};
export type AssetPage = PageMeta & {
  data: Asset[];
};
export type AssetCreate = {
  name: string;
  assetTypeId: string;
  manufacturerId: string;
  modelId: string;
  /** Keyed by the model's connection parameter keys. Write only: no endpoint ever
    returns these values back.
     */
  credentials: {
    [key: string]: string;
  };
};
export type AssetUpdate = {
  name?: string;
  credentials?: {
    [key: string]: string;
  };
};
export type Resolution = 'minute' | 'quarterHour' | 'hour' | 'day' | 'month';
export type Unit = 'W' | 'Wh' | 'percent' | 'celsius';
export type TelemetryPoint = {
  /** Start of the bucket. */
  t: string;
  /** Null marks a gap, which charts must render as a break, not a zero. */
  value: number | null;
};
export type TelemetrySeries = {
  metric: string;
  unit: Unit;
  points: TelemetryPoint[];
};
export type TelemetryResponse = {
  assetId?: string;
  householdId?: string;
  from: string;
  to: string;
  resolution: Resolution;
  series: TelemetrySeries[];
};
export type HouseholdMetric =
  'production' | 'consumption' | 'gridImport' | 'gridExport' | 'batteryCharge' | 'batteryDischarge';
export type LogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type LogSource = 'device' | 'manufacturerCloud' | 'platform';
export type LogEntry = {
  id: string;
  assetId: string;
  ts: string;
  severity: LogSeverity;
  source: LogSource;
  /** Manufacturer fault code, as reported. */
  code?: string;
  message: string;
  /** Untouched payload, shown to installers for diagnosis. */
  raw?: {
    [key: string]: any;
  };
};
export type LogEntryPage = PageMeta & {
  data: LogEntry[];
};
export type AlertSeverity = 'warning' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';
export type AlertSource = 'deviceLog' | 'telemetryThreshold' | 'connectivity';
export type Alert = {
  id: string;
  householdId: string;
  assetId: string;
  /** Present in the cross-household view, where one name is not enough. */
  householdName?: string;
  assetName?: string;
  /** Stable identifier for this kind of problem. */
  code: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  detail?: string;
  derivedFrom: AlertSource;
  firstSeenAt: string;
  lastSeenAt: string;
  /** How many underlying events collapsed into this alert. */
  occurrences: number;
  acknowledgedAt?: string;
  acknowledgedByUserId?: string;
  resolvedAt?: string;
};
export type AlertPage = PageMeta & {
  data: Alert[];
};
export type AlertStatusUpdate = {
  status: 'acknowledged' | 'resolved';
};
export const {
  useSignInMutation,
  useRefreshSessionMutation,
  useSignOutMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useListHouseholdsQuery,
  useLazyListHouseholdsQuery,
  useCreateHouseholdMutation,
  useGetHouseholdQuery,
  useLazyGetHouseholdQuery,
  useUpdateHouseholdMutation,
  useDeleteHouseholdMutation,
  useListHouseholdMembersQuery,
  useLazyListHouseholdMembersQuery,
  useRemoveHouseholdMemberMutation,
  useListHouseholdInvitesQuery,
  useLazyListHouseholdInvitesQuery,
  useCreateHouseholdInviteMutation,
  useRevokeInviteMutation,
  useAcceptInviteMutation,
  useListAssetTypesQuery,
  useLazyListAssetTypesQuery,
  useListManufacturersQuery,
  useLazyListManufacturersQuery,
  useListManufacturerModelsQuery,
  useLazyListManufacturerModelsQuery,
  useListHouseholdAssetsQuery,
  useLazyListHouseholdAssetsQuery,
  useCreateHouseholdAssetMutation,
  useGetAssetQuery,
  useLazyGetAssetQuery,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetAssetTelemetryQuery,
  useLazyGetAssetTelemetryQuery,
  useGetHouseholdTelemetryQuery,
  useLazyGetHouseholdTelemetryQuery,
  useListAssetLogsQuery,
  useLazyListAssetLogsQuery,
  useListHouseholdAlertsQuery,
  useLazyListHouseholdAlertsQuery,
  useListAlertsQuery,
  useLazyListAlertsQuery,
  useGetAlertQuery,
  useLazyGetAlertQuery,
  useUpdateAlertStatusMutation,
} = injectedRtkApi;
