import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { type FetchMock, installFetchMock } from '@/test/fetch-mock';
import { renderWithProviders } from '@/test/render-with-providers';

import { selectAuthStatus, selectCurrentUser } from './auth-slice';
import { SignInForm } from './sign-in-form';

const SIGN_IN = '/api/v1/auth/sessions';

const session = {
  user: {
    id: 'u1',
    email: 'ada@example.com',
    displayName: 'Ada',
    role: 'consumer',
    createdAt: '2026-01-14T09:12:00Z',
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

describe('SignInForm', () => {
  it('rejects an invalid email before sending anything', async () => {
    await renderWithProviders(<SignInForm />);

    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'not-an-email');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'password1');
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    expect(await screen.findByText('Enter a valid email address')).toBeOnTheScreen();
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('rejects a short password before sending anything', async () => {
    await renderWithProviders(<SignInForm />);

    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'ada@example.com');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'short');
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    expect(await screen.findByText('At least 8 characters')).toBeOnTheScreen();
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('signs the user in and keeps the role the API returned', async () => {
    fetchMock.on('POST', SIGN_IN, () => ({ status: 201, body: session }));

    const { store } = await renderWithProviders(<SignInForm />);

    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'ada@example.com');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'password1');
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => expect(selectAuthStatus(store.getState())).toBe('signedIn'));
    expect(selectCurrentUser(store.getState())).toMatchObject({
      email: 'ada@example.com',
      role: 'consumer',
    });
    expect(fetchMock.requests[0]?.body).toEqual({
      email: 'ada@example.com',
      password: 'password1',
    });
  });

  it('shows the reason from the server and stays signed out', async () => {
    fetchMock.on('POST', SIGN_IN, () => ({
      status: 401,
      body: {
        title: 'Not authenticated',
        status: 401,
        code: 'credentials_invalid',
        detail: 'That email and password do not match.',
      },
    }));

    const { store } = await renderWithProviders(<SignInForm />);

    await fireEvent.changeText(screen.getByTestId('sign-in-email'), 'ada@example.com');
    await fireEvent.changeText(screen.getByTestId('sign-in-password'), 'wrongpassword');
    await fireEvent.press(screen.getByTestId('sign-in-submit'));

    expect(await screen.findByText('That email and password do not match.')).toBeOnTheScreen();
    expect(selectAuthStatus(store.getState())).toBe('signedOut');
  });
});
