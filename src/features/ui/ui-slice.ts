import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ThemePreference } from '@/design-system';

export type UiState = {
  themePreference: ThemePreference;
};

const initialState: UiState = {
  themePreference: 'system',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themePreferenceChanged(state, action: PayloadAction<ThemePreference>) {
      state.themePreference = action.payload;
    },
  },
  selectors: {
    selectThemePreference: (state) => state.themePreference,
  },
});

export const { themePreferenceChanged } = uiSlice.actions;
export const { selectThemePreference } = uiSlice.selectors;
export const uiReducer = uiSlice.reducer;
