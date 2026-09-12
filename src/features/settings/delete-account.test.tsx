import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { selectAuthStatus, signedIn } from '@/features/auth/auth-slice';
import { householdSelected } from '@/features/household/household-slice';
import { createStore } from '@/store/create-store';
import { type FetchMock, installFetchMock } from '@/test/fetch-mock';
import { renderWithProviders } from '@/test/render-with-providers';

import { DeleteAccount } from './delete-account';

const DELETE = '/api/v1/users/me/deletion';

let fetchMock: FetchMock;

function signedInStore() {
  const store = createStore();
  store.dispatch(
    signedIn({
      user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    }),
  );
  store.dispatch(householdSelected('h1'));
  return store;
}

beforeEach(() => {
  fetchMock = installFetchMock();
});

afterEach(() => {
  fetchMock.restore();
});

describe('DeleteAccount', () => {
  it('says what will be deleted before offering the button', async () => {
    await renderWithProviders(<DeleteAccount />, { store: signedInStore() });

    expect(
      screen.getAllByText(/Households you own are deleted with their assets/).length,
    ).toBeGreaterThan(0);
  });

  it('asks for the password, and will not submit without one', async () => {
    await renderWithProviders(<DeleteAccount />, { store: signedInStore() });

    await fireEvent.press(screen.getByTestId('delete-account-open'));

    expect(screen.getByTestId('delete-account-password')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('delete-account-confirm'));
    expect(fetchMock.requests).toHaveLength(0);
  });

  it('deletes the account, then signs out so everything stored is cleared', async () => {
    fetchMock.on('POST', DELETE, () => ({ status: 204 }));

    const store = signedInStore();
    await renderWithProviders(<DeleteAccount />, { store });

    await fireEvent.press(screen.getByTestId('delete-account-open'));
    await fireEvent.changeText(screen.getByTestId('delete-account-password'), 'password1');
    await fireEvent.press(screen.getByTestId('delete-account-confirm'));

    await waitFor(() => expect(selectAuthStatus(store.getState())).toBe('signedOut'));
    expect(fetchMock.requests[0]?.body).toEqual({ password: 'password1' });
    expect(store.getState().household.selectedHouseholdId).toBeNull();
  });

  it('keeps the person signed in when the password is wrong', async () => {
    fetchMock.on('POST', DELETE, () => ({
      status: 403,
      body: { title: 'Password incorrect', status: 403, code: 'password_incorrect' },
    }));

    const store = signedInStore();
    await renderWithProviders(<DeleteAccount />, { store });

    await fireEvent.press(screen.getByTestId('delete-account-open'));
    await fireEvent.changeText(screen.getByTestId('delete-account-password'), 'wrong');
    await fireEvent.press(screen.getByTestId('delete-account-confirm'));

    expect(await screen.findByText('That password is not right')).toBeOnTheScreen();
    expect(selectAuthStatus(store.getState())).toBe('signedIn');
  });
});
