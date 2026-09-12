import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { api } from '@/api/api';
import { registerAuthListeners } from '@/features/auth/auth-listeners';
import { authReducer } from '@/features/auth/auth-slice';
import { householdReducer } from '@/features/household/household-slice';
import { uiReducer } from '@/features/ui/ui-slice';

/**
 * Builds an isolated store. The app uses one of these; each test gets its own, so no
 * state or cached query leaks between them.
 */
export function createStore() {
  const listenerMiddleware = createListenerMiddleware();
  registerAuthListeners(listenerMiddleware.startListening);

  const store = configureStore({
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

  return store;
}

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
