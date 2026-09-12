import { signedOut } from '@/features/auth/auth-slice';

import {
  deviceRegistered,
  notificationReducer,
  permissionChecked,
  promptDismissed,
  registrationFailed,
} from './notification-slice';

const initial = () => notificationReducer(undefined, { type: '@@init' });

describe('notification slice', () => {
  it('starts not knowing whether permission exists', () => {
    expect(initial().permission).toBe('unknown');
    expect(initial().deviceId).toBeNull();
  });

  it('records the registered device and clears any earlier failure', () => {
    const failed = notificationReducer(initial(), registrationFailed('network'));
    const state = notificationReducer(failed, deviceRegistered('device-1'));

    expect(state.deviceId).toBe('device-1');
    expect(state.registrationError).toBeNull();
  });

  it('stops asking once the prompt is waved off', () => {
    expect(notificationReducer(initial(), promptDismissed()).promptDismissed).toBe(true);
  });

  it('drops the registration on sign out, since it belonged to that person', () => {
    let state = notificationReducer(initial(), permissionChecked('granted'));
    state = notificationReducer(state, deviceRegistered('device-1'));
    state = notificationReducer(state, promptDismissed());

    const after = notificationReducer(state, signedOut());

    expect(after.deviceId).toBeNull();
    expect(after.promptDismissed).toBe(false);
    // Permission is the handset's, not the person's, so it survives.
    expect(after.permission).toBe('granted');
  });
});
