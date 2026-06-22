export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  /** Raw `Retry-After` header value, when present (e.g. on a 409 IN_PROGRESS). */
  retryAfter?: string;
  details?: unknown;
}

interface ErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
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

  const retryAfter = response?.headers?.get('retry-after');
  if (retryAfter) {
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
