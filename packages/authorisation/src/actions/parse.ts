import base58 from 'bs58';

import type { ValidateOptions } from '../types.js';

const SIGNATURE_LENGTH = 64;

export interface ParsedAuthorization {
  message: string;
  /** The raw 64-byte signature over `message`. */
  signature: Uint8Array;
  /** Unix milliseconds, when the string carries a time. */
  timestamp?: number;
}

/**
 * Splits a `message<separator>signature[<separator>timestamp]` authorization
 * string, as `generate` produces, into its parts. With `expected_message` the
 * message may itself contain the separator, since its length is then known.
 */
export function parseAuthorization(
  value: string,
  options?: Partial<Pick<ValidateOptions, 'separator' | 'expected_message'>>,
): ParsedAuthorization {
  const { separator, expected_message } = { separator: ':', ...options };

  let message: string | undefined;
  let rest: string[];
  if (expected_message === undefined) {
    [message, ...rest] = value.split(separator);
  } else {
    const prefix = `${expected_message}${separator}`;
    if (!value.startsWith(prefix)) {
      throw new Error('Failed to authenticate message.');
    }
    message = expected_message;
    rest = value.slice(prefix.length).split(separator);
  }

  const [encoded, time] = rest;
  if (!message || !encoded) {
    throw new Error('Invalid signature.');
  }
  const signature = decode(encoded);
  if (signature.length !== SIGNATURE_LENGTH) {
    throw new Error('Invalid signature.');
  }

  return time ? { message, signature, timestamp: Number.parseInt(time, 10) } : { message, signature };
}

function decode(encoded: string): Uint8Array {
  try {
    return base58.decode(encoded);
  } catch {
    throw new Error('Invalid signature.');
  }
}
