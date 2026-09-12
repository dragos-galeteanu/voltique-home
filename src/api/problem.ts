import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { i18n } from '@/i18n';

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

/**
 * A message safe to put in front of a user, whatever went wrong.
 *
 * Problem details come from the server already worded for a person, and the API is
 * expected to localise them; everything else is worded here.
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  const problem = getProblem(error);
  if (problem) return problem.detail ?? problem.title;

  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as FetchBaseQueryError).status;
    if (status === 'FETCH_ERROR') return i18n.t('errors.offline');
    if (status === 'TIMEOUT_ERROR') return i18n.t('errors.timeout');
  }

  return fallback ?? i18n.t('errors.generic');
}

/** True when retrying the same request could plausibly succeed. */
export function isRetryable(error: unknown): boolean {
  const problem = getProblem(error);
  if (problem) return problem.status >= 500 || problem.status === 429;

  const status = (error as FetchBaseQueryError | undefined)?.status;
  return status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR';
}
