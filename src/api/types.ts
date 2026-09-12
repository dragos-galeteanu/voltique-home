/**
 * Wire shapes shared by every endpoint. Individual resources are generated from the
 * OpenAPI document in M2 and build on these.
 */

/** RFC 9457 problem details, the error body the API returns. */
export type ProblemDetails = {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  /** Stable machine-readable code, mapped to user-facing copy and retry behaviour. */
  code?: string;
  instance?: string;
};

/** Cursor pagination envelope used by every collection except telemetry. */
export type CursorPage<T> = {
  data: T[];
  nextCursor: string | null;
};

export type CursorPageParams = {
  cursor?: string;
  limit?: number;
};

export function isProblemDetails(value: unknown): value is ProblemDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    'status' in value &&
    typeof (value as ProblemDetails).status === 'number'
  );
}
