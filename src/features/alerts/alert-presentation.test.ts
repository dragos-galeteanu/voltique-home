import type { Alert } from '@/api/generated/endpoints';

import { nextActionsFor, sortForInbox } from './alert-presentation';

const alert = (overrides: Partial<Alert>): Alert => ({
  id: 'a',
  householdId: 'h',
  assetId: 'asset',
  code: 'code',
  severity: 'warning',
  status: 'open',
  title: 'Something',
  derivedFrom: 'deviceLog',
  firstSeenAt: '2026-09-10T00:00:00Z',
  lastSeenAt: '2026-09-10T00:00:00Z',
  occurrences: 1,
  ...overrides,
});

describe('nextActionsFor', () => {
  it('lets an open alert be acknowledged or resolved', () => {
    expect(nextActionsFor('open')).toEqual(['acknowledge', 'resolve']);
  });

  it('lets an acknowledged alert only be resolved', () => {
    expect(nextActionsFor('acknowledged')).toEqual(['resolve']);
  });

  it('offers nothing on a resolved alert, since the server reopens it if it recurs', () => {
    expect(nextActionsFor('resolved')).toEqual([]);
  });
});

describe('sortForInbox', () => {
  it('puts open before acknowledged before resolved', () => {
    const sorted = sortForInbox([
      alert({ id: 'resolved', status: 'resolved' }),
      alert({ id: 'acknowledged', status: 'acknowledged' }),
      alert({ id: 'open', status: 'open' }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(['open', 'acknowledged', 'resolved']);
  });

  it('puts critical above warning within the same status', () => {
    const sorted = sortForInbox([
      alert({ id: 'warning', severity: 'warning' }),
      alert({ id: 'critical', severity: 'critical' }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(['critical', 'warning']);
  });

  it('puts the most recently seen first when status and severity match', () => {
    const sorted = sortForInbox([
      alert({ id: 'older', lastSeenAt: '2026-09-10T08:00:00Z' }),
      alert({ id: 'newer', lastSeenAt: '2026-09-12T08:00:00Z' }),
    ]);

    expect(sorted.map((entry) => entry.id)).toEqual(['newer', 'older']);
  });

  it('does not modify the array it was given', () => {
    const input = [alert({ id: 'resolved', status: 'resolved' }), alert({ id: 'open' })];
    sortForInbox(input);

    expect(input.map((entry) => entry.id)).toEqual(['resolved', 'open']);
  });
});
