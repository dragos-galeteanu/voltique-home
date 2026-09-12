import { screen } from '@testing-library/react-native';

import { Text } from '@/design-system';
import { createStore } from '@/store/create-store';
import { renderWithProviders } from '@/test/render-with-providers';

import { sessionRestored, signedIn } from './auth-slice';
import { RequireSession } from './require-session';
import { RoleGate } from './role-gate';
import type { AuthSession, UserRole } from './types';

// Only Redirect is replaced, so it can be asserted on rather than performed. The rest of
// the module stays real, because the theme provider builds on its navigation themes.
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
}));

const session = (role: UserRole): AuthSession => ({
  user: { id: 'u1', email: 'a@b.c', displayName: 'A', role },
  tokens: { accessToken: 'access', refreshToken: 'refresh' },
});

function storeWith(role: UserRole | null) {
  const store = createStore();
  store.dispatch(role ? signedIn(session(role)) : sessionRestored(null));
  return store;
}

describe('RoleGate', () => {
  it('renders nothing while the stored session is still being read', async () => {
    const store = createStore();

    await renderWithProviders(
      <RoleGate role="consumer">
        <Text>consumer shell</Text>
      </RoleGate>,
      { store },
    );

    expect(screen.queryByText('consumer shell')).toBeNull();
    expect(screen.queryByText(/redirect:/)).toBeNull();
  });

  it('sends a signed-out visitor to sign in', async () => {
    await renderWithProviders(
      <RoleGate role="consumer">
        <Text>consumer shell</Text>
      </RoleGate>,
      { store: storeWith(null) },
    );

    expect(screen.getByText('redirect:/sign-in')).toBeOnTheScreen();
  });

  it('lets the matching role through', async () => {
    await renderWithProviders(
      <RoleGate role="consumer">
        <Text>consumer shell</Text>
      </RoleGate>,
      { store: storeWith('consumer') },
    );

    expect(screen.getByText('consumer shell')).toBeOnTheScreen();
  });

  it('sends an installer to their own shell instead of erroring', async () => {
    await renderWithProviders(
      <RoleGate role="consumer">
        <Text>consumer shell</Text>
      </RoleGate>,
      { store: storeWith('installer') },
    );

    expect(screen.getByText('redirect:/installer/households')).toBeOnTheScreen();
    expect(screen.queryByText('consumer shell')).toBeNull();
  });

  it('sends a consumer away from the installer shell', async () => {
    await renderWithProviders(
      <RoleGate role="installer">
        <Text>installer shell</Text>
      </RoleGate>,
      { store: storeWith('consumer') },
    );

    expect(screen.getByText('redirect:/consumer/dashboard')).toBeOnTheScreen();
  });
});

describe('RequireSession', () => {
  it.each(['consumer', 'installer'] as const)(
    'admits a %s, since a shared screen does not care which role it is',
    async (role) => {
      await renderWithProviders(
        <RequireSession>
          <Text>device logs</Text>
        </RequireSession>,
        { store: storeWith(role) },
      );

      expect(screen.getByText('device logs')).toBeOnTheScreen();
    },
  );

  it('still turns away someone signed out', async () => {
    await renderWithProviders(
      <RequireSession>
        <Text>device logs</Text>
      </RequireSession>,
      { store: storeWith(null) },
    );

    expect(screen.getByText('redirect:/sign-in')).toBeOnTheScreen();
  });
});
