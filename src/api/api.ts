import { createApi } from '@reduxjs/toolkit/query/react';

import { baseQueryWithReauth } from './base-query';

/**
 * One API slice for the whole app. Feature folders add their endpoints with
 * `api.injectEndpoints`, so this file never grows with the surface area.
 *
 * Tags mirror the REST resources under /api/v1 so invalidation stays obvious.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
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
  ],
  endpoints: () => ({}),
});
