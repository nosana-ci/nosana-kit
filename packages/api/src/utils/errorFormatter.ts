/**
 * Error shape every kit request rejects with, once it has reached the server
 * and come back with a status. `statusCode` is guaranteed (it comes from the
 * response), so consumers can branch on it without casting — narrow with
 * {@link isNosanaApiError}.
 */
export interface NosanaApiError extends Error {
  /**
   * Server machine code, when present — one of {@link IdempotencyCode}, or
   * another domain code. Branch on this before `statusCode`.
   */
  code?: string;
  /** HTTP status (`body.statusCode ?? response.status`). */
  statusCode: number;
  /** `Retry-After` in seconds, when the header was present. */
  retryAfter?: number;
  details?: unknown;
}

/**
 * Internal build-type for {@link errorFormatter}. `statusCode` is optional here
 * because not every call site has an HTTP response to read it from; the public
 * {@link NosanaApiError} contract (guaranteed `statusCode`) is what consumers
 * narrow to via {@link isNosanaApiError}.
 */
export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  retryAfter?: number;
  details?: unknown;
}

interface ErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Parses a `Retry-After` header into a non-negative number of seconds. Handles
 * both the delta-seconds form (`"5"`) and the HTTP-date form; returns
 * `undefined` for an absent or unparseable value.
 */
function parseRetryAfter(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.trunc(seconds));
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, Math.ceil((dateMs - Date.now()) / 1000));
  }

  return undefined;
}

/**
 * Type guard narrowing an unknown caught value to {@link NosanaApiError}.
 * Returns `false` for network/timeout/abort errors (which carry no status),
 * letting callers treat those separately from server responses.
 */
export function isNosanaApiError(err: unknown): err is NosanaApiError {
  return (
    err instanceof Error &&
    typeof (err as Partial<NosanaApiError>).statusCode === 'number'
  );
}

/**
 * Builds an {@link ApiError} from an openapi-fetch failure.
 *
 * The HTTP status and `Retry-After` are taken from `response` rather than the
 * error body: the status is a property of the response, so reading it from
 * `response.status` stays correct for error shapes that don't echo a status —
 * proxy/gateway 5xx, framework default error pages, etc. A body `statusCode`,
 * when present, still wins so existing payloads are unaffected.
 */
export function errorFormatter(
  customMessage: string,
  errorObject?: ErrorResponse | unknown,
  response?: Response,
): ApiError {
  const err = new Error() as ApiError;

  // Response-derived metadata is independent of the error body.
  const bodyStatus =
    typeof errorObject === 'object' && errorObject !== null
      ? (errorObject as ErrorResponse).statusCode
      : undefined;
  err.statusCode = bodyStatus ?? response?.status;

  const retryAfter = parseRetryAfter(response?.headers?.get('retry-after'));
  if (retryAfter !== undefined) {
    err.retryAfter = retryAfter;
  }

  if (!errorObject) {
    err.message = customMessage;
    return err;
  }

  if (typeof errorObject === 'object' && errorObject !== null) {
    const { error, message, code } = errorObject as ErrorResponse;

    err.message = `${customMessage}: ${error || message || 'Unknown error'}`;
    err.code = code;
    err.details = errorObject;

    return err;
  }

  if (typeof errorObject === 'string') {
    err.message = `${customMessage}: ${errorObject}`;
    return err;
  }

  err.message = customMessage;
  err.details = errorObject;
  return err;
}
