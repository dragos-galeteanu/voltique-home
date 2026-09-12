import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { signedOut } from '@/features/auth/auth-slice';

export type InviteState = {
  /**
   * An invitation opened while signed out. Held so the link is not lost while the
   * person signs in, then acted on once they are.
   */
  pendingToken: string | null;
};

const initialState: InviteState = { pendingToken: null };

const inviteSlice = createSlice({
  name: 'invite',
  initialState,
  reducers: {
    pendingInviteStored(state, action: PayloadAction<string>) {
      state.pendingToken = action.payload;
    },
    pendingInviteCleared(state) {
      state.pendingToken = null;
    },
  },
  extraReducers: (builder) => {
    // A link belongs to the session that opened it.
    builder.addCase(signedOut, (state) => {
      state.pendingToken = null;
    });
  },
  selectors: {
    selectPendingInvite: (state) => state.pendingToken,
  },
});

export const { pendingInviteStored, pendingInviteCleared } = inviteSlice.actions;
export const { selectPendingInvite } = inviteSlice.selectors;
export const inviteReducer = inviteSlice.reducer;
