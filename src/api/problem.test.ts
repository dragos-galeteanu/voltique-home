import { getErrorMessage, getProblem, isRetryable } from './problem';

const problem = {
  status: 422,
  data: {
    title: 'Credentials rejected by the manufacturer',
    status: 422,
    code: 'asset_credentials_rejected',
    detail: 'The serial number and PIN combination was not accepted.',
  },
};

describe('getProblem', () => {
  it('reads problem details out of an API error', () => {
    expect(getProblem(problem)?.code).toBe('asset_credentials_rejected');
  });

  it('returns null for anything that is not one', () => {
    expect(getProblem(undefined)).toBeNull();
    expect(getProblem({ status: 500, data: 'gateway exploded' })).toBeNull();
  });
});

describe('getErrorMessage', () => {
  it('prefers the detail, which is the sentence written for a person', () => {
    expect(getErrorMessage(problem)).toBe(
      'The serial number and PIN combination was not accepted.',
    );
  });

  it('falls back to the title when there is no detail', () => {
    expect(getErrorMessage({ status: 404, data: { title: 'Not found', status: 404 } })).toBe(
      'Not found',
    );
  });

  it('explains a network failure instead of showing a status', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR', error: 'failed' })).toBe(
      'Cannot reach the server. Check your connection.',
    );
  });

  it('uses the supplied fallback when it cannot tell', () => {
    expect(getErrorMessage(new Error('boom'), 'Could not add that asset')).toBe(
      'Could not add that asset',
    );
  });
});

describe('isRetryable', () => {
  it('is true for server faults, rate limits and network failures', () => {
    expect(isRetryable({ status: 503, data: { title: 'Down', status: 503 } })).toBe(true);
    expect(isRetryable({ status: 429, data: { title: 'Slow down', status: 429 } })).toBe(true);
    expect(isRetryable({ status: 'TIMEOUT_ERROR' })).toBe(true);
  });

  it('is false when retrying cannot help', () => {
    expect(isRetryable(problem)).toBe(false);
    expect(isRetryable({ status: 403, data: { title: 'Nope', status: 403 } })).toBe(false);
  });
});
