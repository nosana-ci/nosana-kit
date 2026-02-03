import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  convertBigIntToNumber,
  type ConvertBigIntToNumber,
  type ConvertTypesForDb,
} from '../../../src/utils/convertBigIntToNumber.js';
import type { ReadonlyUint8Array } from '../../../src/index.js';

describe('convertBigIntToNumber', () => {
  it('converts bigint values to numbers while preserving other types', () => {
    const input = { a: BigInt(42), b: 'x', c: 7 };

    const output = convertBigIntToNumber(input);

    // observable behavior: bigints converted, other types preserved
    expect(output.a).toBe(42);
    expect(typeof output.a).toBe('number');
    expect(output.b).toBe('x');
    expect(output.c).toBe(7);
  });

  it('preserves nested objects without converting their bigints', () => {
    const nestedBigInt = BigInt(10);
    const input = { nested: { d: nestedBigInt } } as any;

    const output = convertBigIntToNumber(input);

    // observable behavior: nested bigints are not converted (shallow conversion)
    expect(typeof output.nested.d).toBe('bigint');
    expect(output.nested.d).toBe(nestedBigInt);
  });

  it('returns a new object without mutating the original', () => {
    const original = { x: BigInt(5) };

    const copy = convertBigIntToNumber(original);

    // observable behavior: original unchanged, copy has converted values
    expect(typeof original.x).toBe('bigint');
    expect(copy.x).toBe(5);
    expect(original).not.toBe(copy);
  });

  it('preserves Uint8Array values without conversion', () => {
    const bytes = new Uint8Array([1, 2, 3]);

    const out = convertBigIntToNumber({ buf: bytes });

    // observable behavior: Uint8Array is preserved as-is
    expect(out.buf).toBe(bytes);
    expect(out.buf).toBeInstanceOf(Uint8Array);
  });

  it('handles empty objects', () => {
    const input = {};

    const output = convertBigIntToNumber(input);

    // observable behavior: empty object returns empty object
    expect(output).toEqual({});
    expect(Object.keys(output)).toHaveLength(0);
  });

  it('handles objects with only non-bigint values', () => {
    const testString = 'test';
    const testNumber = 42;
    const testBoolean = true;
    const input = { str: testString, num: testNumber, bool: testBoolean };

    const output = convertBigIntToNumber(input);

    // observable behavior: all values preserved when no bigints present
    expect(output.str).toBe(testString);
    expect(output.num).toBe(testNumber);
    expect(output.bool).toBe(testBoolean);
  });
});

describe('convertBigIntToNumber type helpers', () => {
  it('ConvertBigIntToNumber type maps bigint to number while preserving other types', () => {
    // type-level test
    type Input = { a: bigint; b: string; c: number };
    type Output = ConvertBigIntToNumber<Input>;

    // observable behavior: type transformation is correct
    expectTypeOf<Output>().toEqualTypeOf<{ a: number; b: string; c: number }>();
  });

  it('ConvertTypesForDb type maps bigint to number and ReadonlyUint8Array to string|null', () => {
    // type-level test
    type Input = {
      a: bigint;
      b: Readonly<Uint8Array>;
      c: ReadonlyUint8Array;
      d: string;
      e: number;
    };
    type Output = ConvertTypesForDb<Input>;

    // observable behavior: type transformation handles both bigint and ReadonlyUint8Array
    expectTypeOf<Output>().toEqualTypeOf<{
      a: number;
      b: string | null;
      c: string | null;
      d: string;
      e: number;
    }>();
  });
});
