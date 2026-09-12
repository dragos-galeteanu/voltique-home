import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { signedOut } from '@/features/auth/auth-slice';

export type HouseholdState = {
  /** Which household the consumer screens are looking at. */
  selectedHouseholdId: string | null;
};

const initialState: HouseholdState = {
  selectedHouseholdId: null,
};

const householdSlice = createSlice({
  name: 'household',
  initialState,
  reducers: {
    householdSelected(state, action: PayloadAction<string>) {
      state.selectedHouseholdId = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Selection belongs to a session, never carry it into the next one.
    builder.addCase(signedOut, (state) => {
      state.selectedHouseholdId = null;
    });
  },
  selectors: {
    selectSelectedHouseholdId: (state) => state.selectedHouseholdId,
  },
});

export const { householdSelected } = householdSlice.actions;
export const { selectSelectedHouseholdId } = householdSlice.selectors;
export const householdReducer = householdSlice.reducer;
