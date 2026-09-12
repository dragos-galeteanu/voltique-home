import {
  connectivityChanged,
  networkReducer,
  selectIsOffline,
  selectOnline,
} from './network-slice';

const initial = () => networkReducer(undefined, { type: '@@init' });

describe('network slice', () => {
  it('starts not knowing, so nothing flashes an offline banner at launch', () => {
    expect(initial().online).toBeNull();
    expect(selectIsOffline({ network: initial() })).toBe(false);
  });

  it('records losing and regaining a connection', () => {
    const offline = networkReducer(initial(), connectivityChanged(false));
    expect(selectIsOffline({ network: offline })).toBe(true);

    const online = networkReducer(offline, connectivityChanged(true));
    expect(selectIsOffline({ network: online })).toBe(false);
    expect(selectOnline({ network: online })).toBe(true);
  });

  it('treats unknown as usable rather than blocking writes on a guess', () => {
    expect(selectIsOffline({ network: { online: null } })).toBe(false);
  });
});
