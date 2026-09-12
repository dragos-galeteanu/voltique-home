/** The round trip: what is written at runtime is what comes back at the next launch. */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '@/api/api';
import { signedIn, signedOut } from '@/features/auth/auth-slice';
import { householdSelected } from '@/features/household/household-slice';
import { itemViewed, recentTrackingChanged } from '@/features/recent/recent-slice';
import { themePreferenceChanged } from '@/features/ui/ui-slice';
import { dashboardRangeChanged } from '@/features/view-state/view-state-slice';
import {
  appearanceEntry,
  recentlyViewedEntry,
  sessionEntry,
  viewStateEntry,
} from '@/storage/registry';
import { read, write } from '@/storage/storage';
import { type AppStore, createStore } from '@/store/create-store';

import { clearPersonalData, hydrateAndPersist, restore } from './persist';

const WRITE_DELAY_MS = 1_100;

let stores: AppStore[] = [];
let stopPersisting: (() => void) | null = null;

function freshStore() {
  const store = createStore();
  stores.push(store);
  return store;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(async () => {
  stopPersisting?.();
  stopPersisting = null;
  stores.forEach((store) => store.dispatch(api.util.resetApiState()));
  stores = [];
});

describe('a second launch', () => {
  it('comes back to the same appearance, range and household', async () => {
    const first = freshStore();
    stopPersisting = await hydrateAndPersist(first);

    first.dispatch(themePreferenceChanged('dark'));
    first.dispatch(dashboardRangeChanged('week'));
    first.dispatch(householdSelected('h1'));

    await new Promise((resolve) => setTimeout(resolve, WRITE_DELAY_MS));

    const second = freshStore();
    await restore(second);

    expect(second.getState().ui.themePreference).toBe('dark');
    expect(second.getState().viewState.dashboardRange).toBe('week');
    expect(second.getState().household.selectedHouseholdId).toBe('h1');
  }, 10_000);
});

describe('signing out', () => {
  it('clears everything about the person and keeps the handset preferences', async () => {
    await write(appearanceEntry, { themePreference: 'dark', languagePreference: 'de' });
    await write(viewStateEntry, {
      dashboardRange: 'week',
      alertFilter: 'all',
      selectedHouseholdId: 'h1',
    });
    await write(recentlyViewedEntry, {
      enabled: true,
      items: [{ kind: 'asset', id: 'a1', name: 'Roof array', at: '2026-09-12T08:00:00Z' }],
    });
    await write(sessionEntry, {
      user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    });

    await clearPersonalData();

    expect(await read(sessionEntry)).toBeNull();
    expect((await read(viewStateEntry)).selectedHouseholdId).toBeNull();
    expect((await read(recentlyViewedEntry)).items).toEqual([]);
    // Belongs to the handset, not to whoever was signed in.
    expect((await read(appearanceEntry)).themePreference).toBe('dark');
  });

  it('leaves nothing of the trail behind in the store either', async () => {
    const store = freshStore();
    store.dispatch(
      signedIn({
        user: { id: 'u1', email: 'ada@example.com', displayName: 'Ada', role: 'consumer' },
        tokens: { accessToken: 'access', refreshToken: 'refresh' },
      }),
    );
    store.dispatch(recentTrackingChanged(true));
    store.dispatch(itemViewed({ kind: 'asset', id: 'a1', name: 'Roof array' }));

    store.dispatch(signedOut());

    expect(store.getState().recent.items).toEqual([]);
    expect(store.getState().household.selectedHouseholdId).toBeNull();
  });
});
