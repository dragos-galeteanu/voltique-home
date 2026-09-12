import { signedOut } from '@/features/auth/auth-slice';
import { storageRestored } from '@/store/persistence/cache-slice';

import {
  itemViewed,
  RECENT_LIMIT,
  recentCleared,
  recentReducer,
  recentTrackingChanged,
} from './recent-slice';

const initial = () => recentReducer(undefined, { type: '@@init' });
const enabled = () => recentReducer(initial(), recentTrackingChanged(true));

const asset = (id: string) => itemViewed({ kind: 'asset' as const, id, name: `Asset ${id}` });

describe('recording what was opened', () => {
  it('records nothing until it is switched on', () => {
    const state = recentReducer(initial(), asset('a1'));

    expect(state.items).toEqual([]);
  });

  it('records once switched on, newest first', () => {
    let state = enabled();
    state = recentReducer(state, asset('a1'));
    state = recentReducer(state, asset('a2'));

    expect(state.items.map((item) => item.id)).toEqual(['a2', 'a1']);
  });

  it('moves something opened again to the front rather than duplicating it', () => {
    let state = enabled();
    state = recentReducer(state, asset('a1'));
    state = recentReducer(state, asset('a2'));
    state = recentReducer(state, asset('a1'));

    expect(state.items.map((item) => item.id)).toEqual(['a1', 'a2']);
  });

  it('keeps a shortcut list, not a history', () => {
    let state = enabled();
    for (let index = 0; index < RECENT_LIMIT + 5; index += 1) {
      state = recentReducer(state, asset(`a${index}`));
    }

    expect(state.items).toHaveLength(RECENT_LIMIT);
  });

  it('tells an asset apart from a household with the same id', () => {
    let state = enabled();
    state = recentReducer(state, asset('x'));
    state = recentReducer(state, itemViewed({ kind: 'household', id: 'x', name: 'Home' }));

    expect(state.items).toHaveLength(2);
  });
});

describe('turning it off', () => {
  it('deletes what was collected rather than only hiding it', () => {
    let state = enabled();
    state = recentReducer(state, asset('a1'));
    state = recentReducer(state, recentTrackingChanged(false));

    expect(state.enabled).toBe(false);
    expect(state.items).toEqual([]);
  });

  it('can be cleared while staying switched on', () => {
    let state = enabled();
    state = recentReducer(state, asset('a1'));
    state = recentReducer(state, recentCleared());

    expect(state.enabled).toBe(true);
    expect(state.items).toEqual([]);
  });
});

describe('across sessions', () => {
  it('drops the trail on sign out, since it belongs to that person', () => {
    let state = enabled();
    state = recentReducer(state, asset('a1'));

    expect(recentReducer(state, signedOut()).items).toEqual([]);
  });

  it('restores a stored trail only when recording was on', () => {
    const stored = {
      enabled: true,
      items: [{ kind: 'asset' as const, id: 'a1', name: 'A', at: 'x' }],
    };

    expect(
      recentReducer(initial(), storageRestored({ recentlyViewed: stored })).items,
    ).toHaveLength(1);

    const disabled = { ...stored, enabled: false };
    expect(recentReducer(initial(), storageRestored({ recentlyViewed: disabled })).items).toEqual(
      [],
    );
  });
});
