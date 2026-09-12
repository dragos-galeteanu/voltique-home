import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NetworkState = {
  /** Null until the first check, so the UI does not flash an offline banner at launch. */
  online: boolean | null;
};

const initialState: NetworkState = { online: null };

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    connectivityChanged(state, action: PayloadAction<boolean>) {
      state.online = action.payload;
    },
  },
  selectors: {
    selectOnline: (state) => state.online,
    /** Deliberately false while unknown: nothing is blocked before the first check. */
    selectIsOffline: (state) => state.online === false,
  },
});

export const { connectivityChanged } = networkSlice.actions;
export const { selectOnline, selectIsOffline } = networkSlice.selectors;
export const networkReducer = networkSlice.reducer;
