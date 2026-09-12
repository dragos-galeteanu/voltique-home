import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { signedOut } from '@/features/auth/auth-slice';

export type PushPermission = 'unknown' | 'undetermined' | 'granted' | 'denied';

export type NotificationState = {
  permission: PushPermission;
  /** Id the API gave this handset, needed to update preferences and to unregister. */
  deviceId: string | null;
  /** Set when someone declines the in-app prompt, so it is not asked again this session. */
  promptDismissed: boolean;
  registrationError: string | null;
};

const initialState: NotificationState = {
  permission: 'unknown',
  deviceId: null,
  promptDismissed: false,
  registrationError: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    permissionChecked(state, action: PayloadAction<PushPermission>) {
      state.permission = action.payload;
    },
    deviceRegistered(state, action: PayloadAction<string>) {
      state.deviceId = action.payload;
      state.registrationError = null;
    },
    registrationFailed(state, action: PayloadAction<string>) {
      state.registrationError = action.payload;
    },
    promptDismissed(state) {
      state.promptDismissed = true;
    },
  },
  extraReducers: (builder) => {
    // The registration belongs to the person who signed in, not to the handset.
    builder.addCase(signedOut, (state) => {
      state.deviceId = null;
      state.promptDismissed = false;
      state.registrationError = null;
    });
  },
  selectors: {
    selectPushPermission: (state) => state.permission,
    selectDeviceId: (state) => state.deviceId,
    selectPromptDismissed: (state) => state.promptDismissed,
    selectRegistrationError: (state) => state.registrationError,
  },
});

export const { permissionChecked, deviceRegistered, registrationFailed, promptDismissed } =
  notificationSlice.actions;

export const {
  selectPushPermission,
  selectDeviceId,
  selectPromptDismissed,
  selectRegistrationError,
} = notificationSlice.selectors;

export const notificationReducer = notificationSlice.reducer;
