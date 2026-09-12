import { createAction, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { PersistedState } from './persisted-state';

/**
 * The action that carries a restored snapshot into the store. The API slice picks it up
 * through `extractRehydrationInfo`, which is RTK Query's supported way back in.
 */
export const cacheRehydrated = createAction<PersistedState>('cache/rehydrated');

export type CacheState = {
  /** When the restored data was captured, so screens can say how old it is. */
  restoredAt: string | null;
  hydrated: boolean;
};

const initialState: CacheState = { restoredAt: null, hydrated: false };

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    /** Nothing was restored, but startup is finished. */
    hydrationFinished(state) {
      state.hydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(cacheRehydrated, (state, action: PayloadAction<PersistedState>) => {
      state.restoredAt = action.payload.savedAt;
      state.hydrated = true;
    });
  },
  selectors: {
    selectRestoredAt: (state) => state.restoredAt,
    selectHydrated: (state) => state.hydrated,
  },
});

export const { hydrationFinished } = cacheSlice.actions;
export const { selectRestoredAt, selectHydrated } = cacheSlice.selectors;
export const cacheReducer = cacheSlice.reducer;
