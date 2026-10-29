import { IncomingHttpHeaders } from 'http';

import { validate } from './validate.js';
import type { GenerateHeaderOptions, ValidateOptions } from '../types.js';

/**
 * Whether the `key` header (`authorization` by default) was signed by the
 * wallet at `address` (its public key in base58).
 */
export function validateHeaders(
  headers: IncomingHttpHeaders,
  address: string,
  options?: Partial<Pick<GenerateHeaderOptions, 'key'>> &
    Partial<ValidateOptions>,
): boolean {
  const { key } = {
    key: 'authorization',
    ...options,
  };

  const validationHeader = headers[key];

  if (!validationHeader) {
    throw new Error(`Header not found with key ${key}.`);
  }

  if (typeof validationHeader !== 'string') {
    throw new Error('Header has invalid type.');
  }

  return validate(validationHeader, address, options);
}