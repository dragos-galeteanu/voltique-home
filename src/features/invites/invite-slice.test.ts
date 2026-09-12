import { signedOut } from '@/features/auth/auth-slice';

import { inviteReducer, pendingInviteCleared, pendingInviteStored } from './invite-slice';

const initial = () => inviteReducer(undefined, { type: '@@init' });

describe('invite slice', () => {
  it('starts with no pending invitation', () => {
    expect(initial().pendingToken).toBeNull();
  });

  it('keeps a token opened while signed out', () => {
    expect(inviteReducer(initial(), pendingInviteStored('abc123')).pendingToken).toBe('abc123');
  });

  it('forgets it once it has been acted on', () => {
    const stored = inviteReducer(initial(), pendingInviteStored('abc123'));
    expect(inviteReducer(stored, pendingInviteCleared()).pendingToken).toBeNull();
  });

  it('does not carry a link into the next session', () => {
    const stored = inviteReducer(initial(), pendingInviteStored('abc123'));
    expect(inviteReducer(stored, signedOut()).pendingToken).toBeNull();
  });
});
