import { ReadonlyUint8Array } from '@solana/kit';

/**
 * Type helper to convert bigint properties to number
 */
export type ConvertBigIntToNumber<T> = {
  [K in keyof T]: T[K] extends bigint ? number : T[K];
};

/**
 * Type helper to convert bigint to number and ReadonlyUint8Array to string
 * @group @nosana/kit
 */
export type ConvertTypesForDb<T> = {
  [K in keyof T]: T[K] extends bigint
  ? number
  : T[K] extends ReadonlyUint8Array
  ? string | null
  : T[K];
};

/**
 * Helper function to convert bigint values to numbers in an object
 * @param obj Object that may contain bigint values
 * @returns Object with all bigint values converted to numbers
 */
export function convertBigIntToNumber<T extends Record<string, unknown>>(
  obj: T
): ConvertBigIntToNumber<T> {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'bigint') {
      (result as Record<string, unknown>)[key] = Number(value);
    }
  }
  return result as ConvertBigIntToNumber<T>;
}
