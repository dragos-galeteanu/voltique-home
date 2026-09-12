import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { type FetchMock, installFetchMock } from '@/test/fetch-mock';
import { renderWithProviders } from '@/test/render-with-providers';

import { selectAuthStatus, selectCurrentUser } from './auth-slice';
import { SignUpForm } from './sign-up-form';

const SIGN_UP = '/api/v1/auth/registrations';

const session = {
  user: {
    id: 'u2',
    email: 'sam@example.com',
    displayName: 'Sam',
    role: 'consumer',
    createdAt: '2026-09-12T08:00:00Z',
  },
  tokens: { accessToken: 'access-1', refreshToken: 'refresh-1', expiresIn: 900 },
};

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = installFetchMock();
});

afterEach(() => {
  fetchMock.restore();
});

async function fill(values: {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}) {
  if (values.name !== undefined) {
    await fireEvent.changeText(screen.getByTestId('sign-up-name'), values.name);
  }
  if (values.email !== undefined) {
    await fireEvent.changeText(screen.getByTestId('sign-up-email'), values.email);
  }
  if (values.password !== undefined) {
    await fireEvent.changeText(screen.getByTestId('sign-up-password'), values.password);
  }
  if (values.confirm !== undefined) {
    await fireEvent.changeText(screen.getByTestId('sign-up-confirm'), values.confirm);
  }
}

describe('SignUpForm', () => {
  it('will not send an account without a name', async () => {
    await renderWithProviders(<SignUpForm />);

    await fill({ email: 'sam@example.com', password: 'password1', confirm: 'password1' });
    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    expect(await screen.findByTestId('sign-up-name-error')).toBeOnTheScreen();
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('refuses two passwords that do not match', async () => {
    await renderWithProviders(<SignUpForm />);

    await fill({
      name: 'Sam',
      email: 'sam@example.com',
      password: 'password1',
      confirm: 'password2',
    });
    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    expect(await screen.findByTestId('sign-up-confirm-error')).toBeOnTheScreen();
    expect(screen.getByText('Both passwords have to match')).toBeOnTheScreen();
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('creates the account and signs in, without sending the confirmation field', async () => {
    fetchMock.on('POST', SIGN_UP, () => ({ status: 201, body: session }));

    const { store } = await renderWithProviders(<SignUpForm />);

    await fill({
      name: 'Sam',
      email: 'sam@example.com',
      password: 'password1',
      confirm: 'password1',
    });
    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    await waitFor(() => expect(selectAuthStatus(store.getState())).toBe('signedIn'));
    expect(selectCurrentUser(store.getState())).toMatchObject({ email: 'sam@example.com' });
    expect(fetchMock.requests[0]?.body).toEqual({
      displayName: 'Sam',
      email: 'sam@example.com',
      password: 'password1',
    });
  });

  it('says what to do when the address already has an account', async () => {
    fetchMock.on('POST', SIGN_UP, () => ({
      status: 409,
      body: { title: 'Address already registered', status: 409, code: 'email_already_registered' },
    }));

    const { store } = await renderWithProviders(<SignUpForm />);

    await fill({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password1',
      confirm: 'password1',
    });
    await fireEvent.press(screen.getByTestId('sign-up-submit'));

    expect(await screen.findByText('An account already exists for that address')).toBeOnTheScreen();
    // Nobody is signed in: a fresh store has not read stored credentials either.
    expect(selectAuthStatus(store.getState())).not.toBe('signedIn');
    expect(selectCurrentUser(store.getState())).toBeNull();
  });
});
