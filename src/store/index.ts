import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { api } from '@/api/api';
import { registerAuthListeners } from '@/features/auth/auth-listeners';
import { authReducer } from '@/features/auth/auth-slice';
import { householdReducer } from '@/features/household/household-slice';
import { uiReducer } from '@/features/ui/ui-slice';

import { listenerMiddleware } from './listener';

registerAuthListeners();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    household: householdReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware).concat(api.middleware),
});

/** Enables refetchOnFocus and refetchOnReconnect for RTK Query. */
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
