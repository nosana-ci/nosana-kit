import { convertBigIntToNumber, ConvertBigIntToNumber, ConvertTypesForDb } from '../index';

describe('Utils', () => {
  describe('convertBigIntToNumber', () => {
    it('should convert bigint values to numbers', () => {
      const input = {
        id: BigInt(123),
        name: 'test',
        count: BigInt(456),
        active: true,
      };

      const result = convertBigIntToNumber(input);

      expect(result.id).toBe(123);
      expect(typeof result.id).toBe('number');
      expect(result.name).toBe('test');
      expect(result.count).toBe(456);
      expect(typeof result.count).toBe('number');
      expect(result.active).toBe(true);
    });

    it('should handle objects without bigint values', () => {
      const input = {
        name: 'test',
        count: 42,
        active: true,
        data: { nested: 'value' },
      };

      const result = convertBigIntToNumber(input);

      expect(result).toEqual(input);
      expect(result.name).toBe('test');
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.data).toEqual({ nested: 'value' });
    });

    it('should handle empty objects', () => {
      const input = {};
      const result = convertBigIntToNumber(input);
      expect(result).toEqual({});
    });

    it('should handle objects with mixed types', () => {
      const input = {
        bigIntValue: BigInt(999),
        stringValue: 'hello',
        numberValue: 42,
        booleanValue: false,
        nullValue: null,
        undefinedValue: undefined,
        arrayValue: [1, 2, 3],
        objectValue: { key: 'value' },
      };

      const result = convertBigIntToNumber(input);

      expect(result.bigIntValue).toBe(999);
      expect(typeof result.bigIntValue).toBe('number');
      expect(result.stringValue).toBe('hello');
      expect(result.numberValue).toBe(42);
      expect(result.booleanValue).toBe(false);
      expect(result.nullValue).toBe(null);
      expect(result.undefinedValue).toBe(undefined);
      expect(result.arrayValue).toEqual([1, 2, 3]);
      expect(result.objectValue).toEqual({ key: 'value' });
    });

    it('should handle large bigint values', () => {
      const input = {
        largeBigInt: BigInt('9007199254740991'), // Number.MAX_SAFE_INTEGER
        veryLargeBigInt: BigInt('9007199254740992'), // Number.MAX_SAFE_INTEGER + 1
      };

      const result = convertBigIntToNumber(input);

      expect(result.largeBigInt).toBe(9007199254740991);
      expect(result.veryLargeBigInt).toBe(9007199254740992);
      expect(typeof result.largeBigInt).toBe('number');
      expect(typeof result.veryLargeBigInt).toBe('number');
    });

    it('should preserve the original object structure', () => {
      const input = {
        level1: {
          level2: {
            bigIntValue: BigInt(789),
            normalValue: 'nested',
          },
        },
        topLevel: BigInt(123),
      };

      const result = convertBigIntToNumber(input);

      // Only top-level bigint values should be converted
      expect(result.topLevel).toBe(123);
      expect(typeof result.topLevel).toBe('number');

      // Nested objects should remain unchanged
      expect(result.level1.level2.bigIntValue).toBe(BigInt(789));
      expect(result.level1.level2.normalValue).toBe('nested');
    });
  });

  describe('Type definitions', () => {
    it('should have correct ConvertBigIntToNumber type', () => {
      type TestType = {
        id: bigint;
        name: string;
        count: bigint;
        active: boolean;
      };

      type ConvertedType = ConvertBigIntToNumber<TestType>;

      // This is a compile-time test - if it compiles, the types are correct
      const example: ConvertedType = {
        id: 123, // should be number
        name: 'test', // should remain string
        count: 456, // should be number
        active: true, // should remain boolean
      };

      expect(example.id).toBe(123);
      expect(example.name).toBe('test');
      expect(example.count).toBe(456);
      expect(example.active).toBe(true);
    });

    it('should have correct ConvertTypesForDb type', () => {
      type TestType = {
        id: bigint;
        name: string;
        data: Uint8Array;
        active: boolean;
      };

      type ConvertedType = ConvertTypesForDb<TestType>;

      // This is a compile-time test - if it compiles, the types are correct
      const example: ConvertedType = {
        id: 123, // should be number (bigint -> number)
        name: 'test', // should remain string
        data: 'base64string', // should be string (ReadonlyUint8Array -> string)
        active: true, // should remain boolean
      };

      expect(example.id).toBe(123);
      expect(example.name).toBe('test');
      expect(example.data).toBe('base64string');
      expect(example.active).toBe(true);
    });
  });
}); 