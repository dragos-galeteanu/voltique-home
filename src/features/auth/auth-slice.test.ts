import { authReducer, sessionRestored, signedIn, signedOut, tokensRefreshed } from './auth-slice';
import type { AuthSession } from './types';

const session: AuthSession = {
  user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
  tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' },
};

function initial() {
  return authReducer(undefined, { type: '@@init' });
}

describe('auth slice', () => {
  it('starts out restoring, so no shell is chosen before storage is read', () => {
    expect(initial().status).toBe('restoring');
  });

  it('signs out when there is no stored session', () => {
    const state = authReducer(initial(), sessionRestored(null));
    expect(state.status).toBe('signedOut');
    expect(state.user).toBeNull();
  });

  it('restores a stored session', () => {
    const state = authReducer(initial(), sessionRestored(session));
    expect(state.status).toBe('signedIn');
    expect(state.user?.role).toBe('consumer');
  });

  it('keeps the user when only the tokens are refreshed', () => {
    const signedInState = authReducer(initial(), signedIn(session));
    const state = authReducer(
      signedInState,
      tokensRefreshed({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
    );

    expect(state.tokens?.accessToken).toBe('access-2');
    expect(state.user?.id).toBe('u1');
    expect(state.status).toBe('signedIn');
  });

  it('clears everything on sign out', () => {
    const signedInState = authReducer(initial(), signedIn(session));
    const state = authReducer(signedInState, signedOut());

    expect(state).toEqual({ status: 'signedOut', user: null, tokens: null });
  });
});
