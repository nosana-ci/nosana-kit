import { describe, expect, it } from 'vitest';

import {
  base64ToBytes,
  bytesToBase64,
  concatBytes,
  encodeSshString,
  encodeUint32,
  readUint32,
} from '../encoding.js';

describe('encoding', () => {
  it('round-trips bytes through base64', () => {
    const bytes = Uint8Array.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(bytesToBase64(bytes)).toBe('AAEC+vv8/f7/');
    expect(base64ToBytes('AAEC+vv8/f7/')).toEqual(bytes);
    expect(base64ToBytes('aGk=')).toEqual(Uint8Array.from([104, 105]));
  });

  it.each(['', 'aGk', 'aGl=', 'aG k=', 'a+/=', 'AAECAx=='])(
    'rejects non-canonical base64 %j',
    (value) => {
      expect(base64ToBytes(value)).toBeUndefined();
    }
  );

  it('encodes and reads big-endian uint32 values', () => {
    expect(encodeUint32(0x01020304)).toEqual(Uint8Array.from([1, 2, 3, 4]));
    expect(encodeUint32(0xffffffff)).toEqual(Uint8Array.from([255, 255, 255, 255]));
    expect(readUint32(Uint8Array.from([1, 2, 3, 4]), 0)).toBe(0x01020304);
    expect(readUint32(Uint8Array.from([255, 255, 255, 255]), 0)).toBe(0xffffffff);
  });

  it('reads through a subarray offset and rejects out-of-range reads', () => {
    const view = Uint8Array.from([9, 9, 0, 0, 0, 7]).subarray(2);
    expect(readUint32(view, 0)).toBe(7);
    expect(readUint32(view, 1)).toBeUndefined();
    expect(readUint32(view, -1)).toBeUndefined();
  });

  it('length-prefixes ssh strings and concatenates chunks', () => {
    expect(encodeSshString(Uint8Array.from([1, 2]))).toEqual(Uint8Array.from([0, 0, 0, 2, 1, 2]));
    expect(concatBytes(Uint8Array.from([1]), new Uint8Array(), Uint8Array.from([2, 3]))).toEqual(
      Uint8Array.from([1, 2, 3])
    );
  });
});
