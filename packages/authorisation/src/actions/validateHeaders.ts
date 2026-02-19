import { IncomingHttpHeaders } from 'http';

import { validate } from './validate.js';
import type { GenerateHeaderOptions, ValidateOptions } from '../types.js';

export function validateHeaders(
  headers: IncomingHttpHeaders,
  publicKey: Uint8Array<ArrayBufferLike>,
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

  return validate(validationHeader, publicKey, options);
}