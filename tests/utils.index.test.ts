import { describe, it, expect, expectTypeOf } from 'vitest';
import { convertBigIntToNumber } from '../src/utils/index.js';
import type { ConvertBigIntToNumber, ConvertTypesForDb } from '../src/utils/index.js';
import type { ReadonlyUint8Array } from '../src/index.js';

describe('utils/index convertBigIntToNumber', () => {
  it('converts top-level bigint properties to numbers', () => {
    const input = { a: BigInt(42), b: 'x', c: 7 };
    const output = convertBigIntToNumber(input);
    expect(output.a).toBe(42);
    expect(typeof output.a).toBe('number');
    expect(output.b).toBe('x');
    expect(output.c).toBe(7);
  });

  it('is shallow: nested bigints are not converted', () => {
    const input = { nested: { d: BigInt(10) } } as any;
    const output = convertBigIntToNumber(input);
    expect(typeof output.nested.d).toBe('bigint');
    expect(output.nested.d).toBe(BigInt(10));
  });

  it('does not mutate the original object', () => {
    const original = { x: BigInt(5) };
    const copy = convertBigIntToNumber(original);
    expect(typeof original.x).toBe('bigint');
    expect(copy.x).toBe(5);
  });

  it('leaves Uint8Array-like values unchanged', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const out = convertBigIntToNumber({ buf: bytes });
    expect(out.buf).toBe(bytes);
  });
});

describe('utils/index type helpers', () => {
  it('ConvertBigIntToNumber maps bigint properties to number (type-level)', () => {
    type Input = { a: bigint; b: string; c: number };
    type Output = ConvertBigIntToNumber<Input>;
    expectTypeOf<Output>().toEqualTypeOf<{ a: number; b: string; c: number }>();
  });

  it('ConvertTypesForDb maps bigint to number and ReadonlyUint8Array to string|null (type-level)', () => {
    type Input = {
      a: bigint;
      b: Readonly<Uint8Array>;
      c: ReadonlyUint8Array;
      d: string;
      e: number;
    };
    type Output = ConvertTypesForDb<Input>;
    // b: Readonly<Uint8Array> is structurally compatible with ReadonlyUint8Array
    expectTypeOf<Output>().toEqualTypeOf<{
      a: number;
      b: string | null;
      c: string | null;
      d: string;
      e: number;
    }>();
  });
});
