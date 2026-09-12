import { signedOut } from '@/features/auth/auth-slice';

import { householdReducer, householdSelected } from './household-slice';

function initial() {
  return householdReducer(undefined, { type: '@@init' });
}

describe('household slice', () => {
  it('starts with nothing selected', () => {
    expect(initial().selectedHouseholdId).toBeNull();
  });

  it('remembers the selected household', () => {
    const state = householdReducer(initial(), householdSelected('h1'));
    expect(state.selectedHouseholdId).toBe('h1');
  });

  it('forgets the selection on sign out, so it cannot leak into the next session', () => {
    const selected = householdReducer(initial(), householdSelected('h1'));
    const state = householdReducer(selected, signedOut());

    expect(state.selectedHouseholdId).toBeNull();
  });
});
