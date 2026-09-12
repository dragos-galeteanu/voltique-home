import { createApi } from '@reduxjs/toolkit/query/react';

import { storageRestored } from '@/store/persistence/cache-slice';

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
  // RTK Query keeps an unused cache entry for a minute, holding a removal timer that
  // would outlive a Jest test and report as a leak. Tests drop entries at once.
  keepUnusedDataFor: process.env.NODE_ENV === 'test' ? 0 : 60,
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
    'Device',
  ],
  /**
   * Restores the cache written at the last cold start, so a phone with no signal still
   * shows the dashboard, assets and alerts it showed last time.
   */
  extractRehydrationInfo(action) {
    if (!storageRestored.match(action)) return undefined;

    // The snapshot holds only completed queries. RTK Query reads `queries` and
    // `mutations` from what it is handed and rebuilds everything else, so the narrower
    // shape is widened here rather than padded with structures that get discarded.
    // Naming the full type would refer to this slice while defining it. A test covers
    // that a restored query really does come back.
    return action.payload.cache?.api as never;
  },
  endpoints: () => ({}),
});
