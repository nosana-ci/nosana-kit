export interface ApiError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

interface ErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
}

export function errorFormatter(
  customMessage: string,
  errorObject?: ErrorResponse | unknown,
): ApiError {
  const err = new Error() as ApiError;

  if (!errorObject) {
    err.message = customMessage;
    return err;
  }

  if (typeof errorObject === 'object' && errorObject !== null) {
    const { error, message, code, statusCode } = errorObject as ErrorResponse;

    err.message = `${customMessage}: ${error || message || 'Unknown error'}`;
    err.code = code;
    err.statusCode = statusCode;
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
