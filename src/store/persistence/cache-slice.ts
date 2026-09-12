import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RecentState } from '@/features/recent/recent-slice';
import type { ViewState } from '@/features/view-state/view-state-slice';

import type { CacheSnapshot } from './persisted-state';

/**
 * Everything read back from storage at launch, delivered as one action.
 *
 * Each slice takes what it recognises, including the API client, which picks up the
 * cached responses through RTK Query's own rehydration hook. One action rather than six
 * keeps the order of restoration from mattering.
 */
export type RestoredState = {
  appearance?: { themePreference: string; languagePreference: string };
  prompts?: { notificationPromptDismissed: boolean };
  viewState?: ViewState;
  recentlyViewed?: RecentState;
  dev?: { mockScenario: string | null };
  selectedHouseholdId?: string | null;
  cache?: CacheSnapshot | null;
};

export const storageRestored = createAction<RestoredState>('storage/restored');

export type CacheState = {
  /** When the restored data was captured, so screens can say how old it is. */
  restoredAt: string | null;
  hydrated: boolean;
};

const initialState: CacheState = { restoredAt: null, hydrated: false };

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(storageRestored, (state, action: PayloadAction<RestoredState>) => {
      state.restoredAt = action.payload.cache?.savedAt ?? null;
      state.hydrated = true;
    });
  },
  selectors: {
    selectRestoredAt: (state) => state.restoredAt,
    selectHydrated: (state) => state.hydrated,
  },
});

export const { selectRestoredAt, selectHydrated } = cacheSlice.selectors;
export const cacheReducer = cacheSlice.reducer;
