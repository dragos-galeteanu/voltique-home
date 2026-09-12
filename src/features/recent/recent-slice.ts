import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { signedOut } from '@/features/auth/auth-slice';
import { storageRestored } from '@/store/persistence/cache-slice';

/** Long enough to be useful, short enough not to become a history of someone's month. */
export const RECENT_LIMIT = 8;

export type RecentItem = {
  kind: 'asset' | 'household';
  id: string;
  name: string;
  /** When it was last opened, ISO 8601. */
  at: string;
};

export type RecentState = {
  /**
   * Off until switched on in settings. Nothing is recorded while this is false, which is
   * the difference between a setting and a pretence of one.
   */
  enabled: boolean;
  items: RecentItem[];
};

const initialState: RecentState = { enabled: false, items: [] };

const recentSlice = createSlice({
  name: 'recent',
  initialState,
  reducers: {
    recentTrackingChanged(state, action: PayloadAction<boolean>) {
      state.enabled = action.payload;
      // Turning it off deletes what was collected, rather than only hiding it.
      if (!action.payload) state.items = [];
    },
    itemViewed(state, action: PayloadAction<Omit<RecentItem, 'at'>>) {
      if (!state.enabled) return;

      const { kind, id, name } = action.payload;
      const without = state.items.filter((item) => !(item.kind === kind && item.id === id));
      state.items = [{ kind, id, name, at: new Date().toISOString() }, ...without].slice(
        0,
        RECENT_LIMIT,
      );
    },
    recentCleared(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    // The trail belongs to the person, not the handset.
    builder.addCase(signedOut, (state) => {
      state.items = [];
    });

    builder.addCase(storageRestored, (state, action) => {
      const restored = action.payload.recentlyViewed;
      if (!restored) return;
      state.enabled = restored.enabled;
      state.items = restored.enabled ? restored.items : [];
    });
  },
  selectors: {
    selectRecentEnabled: (state) => state.enabled,
    selectRecentItems: (state) => state.items,
  },
});

export const { recentTrackingChanged, itemViewed, recentCleared } = recentSlice.actions;
export const { selectRecentEnabled, selectRecentItems } = recentSlice.selectors;
export const recentReducer = recentSlice.reducer;
