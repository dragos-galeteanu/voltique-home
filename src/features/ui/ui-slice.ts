import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ThemePreference } from '@/design-system';
import type { SupportedLocale } from '@/i18n';

/** "system" follows the device; anything else is an explicit choice by the user. */
export type LanguagePreference = 'system' | SupportedLocale;

export type UiState = {
  themePreference: ThemePreference;
  languagePreference: LanguagePreference;
};

const initialState: UiState = {
  themePreference: 'system',
  languagePreference: 'system',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    themePreferenceChanged(state, action: PayloadAction<ThemePreference>) {
      state.themePreference = action.payload;
    },
    languagePreferenceChanged(state, action: PayloadAction<LanguagePreference>) {
      state.languagePreference = action.payload;
    },
  },
  selectors: {
    selectThemePreference: (state) => state.themePreference,
    selectLanguagePreference: (state) => state.languagePreference,
  },
});

export const { themePreferenceChanged, languagePreferenceChanged } = uiSlice.actions;
export const { selectThemePreference, selectLanguagePreference } = uiSlice.selectors;
export const uiReducer = uiSlice.reducer;
