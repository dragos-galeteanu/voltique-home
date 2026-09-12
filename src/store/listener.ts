import { createListenerMiddleware } from '@reduxjs/toolkit';

/**
 * Side effects that react to state changes, such as persisting the session. Kept
 * separate from reducers so reducers stay pure and testable.
 */
export const listenerMiddleware = createListenerMiddleware();

export const startAppListening = listenerMiddleware.startListening;
