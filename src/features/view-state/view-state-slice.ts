import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AlertFilter } from '@/features/alerts/alert-filters';
import type { RangeKey } from '@/features/telemetry/range';
import { storageRestored } from '@/store/persistence/cache-slice';

/**
 * Where the person left off. Restored at launch so the dashboard opens on the range they
 * were looking at and the inbox on the filter they chose, rather than resetting to a
 * default they keep having to change back.
 */
export type ViewState = {
  dashboardRange: RangeKey;
  alertFilter: AlertFilter;
};

const initialState: ViewState = {
  dashboardRange: 'day',
  alertFilter: 'open',
};

const viewStateSlice = createSlice({
  name: 'viewState',
  initialState,
  reducers: {
    dashboardRangeChanged(state, action: PayloadAction<RangeKey>) {
      state.dashboardRange = action.payload;
    },
    alertFilterChanged(state, action: PayloadAction<AlertFilter>) {
      state.alertFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(storageRestored, (state, action) => {
      const restored = action.payload.viewState;
      if (!restored) return;
      state.dashboardRange = restored.dashboardRange;
      state.alertFilter = restored.alertFilter;
    });
  },
  selectors: {
    selectDashboardRange: (state) => state.dashboardRange,
    selectAlertFilter: (state) => state.alertFilter,
  },
});

export const { dashboardRangeChanged, alertFilterChanged } = viewStateSlice.actions;
export const { selectDashboardRange, selectAlertFilter } = viewStateSlice.selectors;
export const viewStateReducer = viewStateSlice.reducer;
