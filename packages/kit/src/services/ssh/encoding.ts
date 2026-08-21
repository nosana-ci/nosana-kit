const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function concatBytes(...values: Uint8Array[]): Uint8Array {
  const length = values.reduce((total, value) => total + value.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;

  for (const value of values) {
    result.set(value, offset);
    offset += value.length;
  }

  return result;
}

export function encodeUint32(value: number): Uint8Array {
  return Uint8Array.of(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  );
}

export function encodeSshField(value: Uint8Array): Uint8Array {
  return concatBytes(encodeUint32(value.length), value);
}

export function readUint32(value: Uint8Array, offset: number): number | undefined {
  if (offset < 0 || offset + 4 > value.length) return undefined;

  return (
    value[offset] * 0x1000000 +
    value[offset + 1] * 0x10000 +
    value[offset + 2] * 0x100 +
    value[offset + 3]
  );
}

export function bytesToBase64(value: Uint8Array): string {
  let result = '';

  for (let offset = 0; offset < value.length; offset += 3) {
    const first = value[offset];
    const second = value[offset + 1];
    const third = value[offset + 2];
    const combined = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    result += BASE64_ALPHABET[(combined >>> 18) & 0x3f];
    result += BASE64_ALPHABET[(combined >>> 12) & 0x3f];
    result += second === undefined ? '=' : BASE64_ALPHABET[(combined >>> 6) & 0x3f];
    result += third === undefined ? '=' : BASE64_ALPHABET[combined & 0x3f];
  }

  return result;
}

export function base64ToBytes(value: string): Uint8Array | undefined {
  if (value.length === 0 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    return undefined;
  }

  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const result = new Uint8Array((value.length / 4) * 3 - padding);
  let outputOffset = 0;

  for (let offset = 0; offset < value.length; offset += 4) {
    const characters = value.slice(offset, offset + 4);
    const indexes = [...characters].map((character) =>
      character === '=' ? 0 : BASE64_ALPHABET.indexOf(character)
    );
    if (indexes.some((index) => index < 0)) return undefined;

    const combined = (indexes[0] << 18) | (indexes[1] << 12) | (indexes[2] << 6) | indexes[3];

    if (outputOffset < result.length) result[outputOffset++] = (combined >>> 16) & 0xff;
    if (outputOffset < result.length) result[outputOffset++] = (combined >>> 8) & 0xff;
    if (outputOffset < result.length) result[outputOffset++] = combined & 0xff;
  }

  return bytesToBase64(result) === value ? result : undefined;
}
