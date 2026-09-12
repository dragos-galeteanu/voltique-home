import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { createStore } from '@/store/create-store';
import { renderWithProviders } from '@/test/render-with-providers';

import { permissionChecked, promptDismissed, selectPushPermission } from './notification-slice';
import { PermissionPrompt } from './permission-prompt';

function storeWith(permission: 'unknown' | 'undetermined' | 'granted' | 'denied') {
  const store = createStore();
  store.dispatch(permissionChecked(permission));
  return store;
}

describe('PermissionPrompt', () => {
  it('asks when permission has not been decided', async () => {
    await renderWithProviders(<PermissionPrompt />, { store: storeWith('undetermined') });

    expect(screen.getByTestId('notification-prompt')).toBeOnTheScreen();
    expect(screen.getByText('Know when something breaks')).toBeOnTheScreen();
  });

  it('stays quiet before permission has been checked', async () => {
    await renderWithProviders(<PermissionPrompt />, { store: storeWith('unknown') });

    expect(screen.queryByTestId('notification-prompt')).toBeNull();
  });

  it.each(['granted', 'denied'] as const)('stays quiet once permission is %s', async (state) => {
    await renderWithProviders(<PermissionPrompt />, { store: storeWith(state) });

    expect(screen.queryByTestId('notification-prompt')).toBeNull();
  });

  it('stops asking after it is waved off', async () => {
    const store = storeWith('undetermined');
    store.dispatch(promptDismissed());

    await renderWithProviders(<PermissionPrompt />, { store });

    expect(screen.queryByTestId('notification-prompt')).toBeNull();
  });

  it('records the answer when someone allows it', async () => {
    const store = storeWith('undetermined');

    await renderWithProviders(<PermissionPrompt />, { store });
    await fireEvent.press(screen.getByTestId('notification-prompt-allow'));

    await waitFor(() => expect(selectPushPermission(store.getState())).toBe('granted'));
  });
});
