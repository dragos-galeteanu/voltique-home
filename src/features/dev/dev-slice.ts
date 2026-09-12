import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ScenarioId } from '@/mocks/scenarios';
import { storageRestored } from '@/store/persistence/cache-slice';

export type DevState = {
  /**
   * When set, the API client answers from fixtures instead of the network. Only ever set
   * in a development build; release builds ignore it.
   */
  mockScenario: ScenarioId | null;
};

const initialState: DevState = { mockScenario: null };

const devSlice = createSlice({
  name: 'dev',
  initialState,
  reducers: {
    mockScenarioSelected(state, action: PayloadAction<ScenarioId | null>) {
      state.mockScenario = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Survives a reload, so a scenario does not have to be picked again after every save.
    builder.addCase(storageRestored, (state, action) => {
      state.mockScenario = (action.payload.dev?.mockScenario as ScenarioId | null) ?? null;
    });
  },
  selectors: {
    selectMockScenario: (state) => state.mockScenario,
  },
});

export const { mockScenarioSelected } = devSlice.actions;
export const { selectMockScenario } = devSlice.selectors;
export const devReducer = devSlice.reducer;
