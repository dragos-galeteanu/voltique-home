import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { isProblemDetails, type ProblemDetails } from './types';

/**
 * Pulls the problem details out of an RTK Query error. Screens show `title` and use
 * `code` for anything conditional, never the raw status.
 */
export function getProblem(error: unknown): ProblemDetails | null {
  if (!error || typeof error !== 'object' || !('status' in error)) return null;

  const data = (error as FetchBaseQueryError).data;
  return isProblemDetails(data) ? data : null;
}

/** A message safe to put in front of a user, whatever went wrong. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const problem = getProblem(error);
  if (problem) return problem.detail ?? problem.title;

  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as FetchBaseQueryError).status;
    if (status === 'FETCH_ERROR') return 'Cannot reach the server. Check your connection.';
    if (status === 'TIMEOUT_ERROR') return 'The server took too long to respond.';
  }

  return fallback;
}

/** True when retrying the same request could plausibly succeed. */
export function isRetryable(error: unknown): boolean {
  const problem = getProblem(error);
  if (problem) return problem.status >= 500 || problem.status === 429;

  const status = (error as FetchBaseQueryError | undefined)?.status;
  return status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR';
}
