import { storageRestored } from '@/store/persistence/cache-slice';

import { alertFilterChanged, dashboardRangeChanged, viewStateReducer } from './view-state-slice';

const initial = () => viewStateReducer(undefined, { type: '@@init' });

describe('view state', () => {
  it('opens on today and on open alerts before anything is chosen', () => {
    expect(initial()).toEqual({ dashboardRange: 'day', alertFilter: 'open' });
  });

  it('remembers the range and the filter that were chosen', () => {
    let state = viewStateReducer(initial(), dashboardRangeChanged('month'));
    state = viewStateReducer(state, alertFilterChanged('resolved'));

    expect(state).toEqual({ dashboardRange: 'month', alertFilter: 'resolved' });
  });

  it('comes back as it was left', () => {
    const restored = viewStateReducer(
      initial(),
      storageRestored({ viewState: { dashboardRange: 'week', alertFilter: 'acknowledged' } }),
    );

    expect(restored).toEqual({ dashboardRange: 'week', alertFilter: 'acknowledged' });
  });

  it('keeps its defaults when there was nothing stored', () => {
    expect(viewStateReducer(initial(), storageRestored({}))).toEqual(initial());
  });
});
