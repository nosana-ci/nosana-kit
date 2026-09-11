/** Byte helpers for the OpenSSH wire format and strict base64 text. */

export function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function encodeUint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

export function readUint32(bytes: Uint8Array, offset: number): number | undefined {
  if (offset < 0 || offset + 4 > bytes.length) return undefined;
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

/** An SSH `string`: a big-endian uint32 length followed by the bytes. */
export function encodeSshString(value: Uint8Array): Uint8Array {
  return concatBytes(encodeUint32(value.length), value);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Decodes canonical base64 only: the bits an encoder leaves unused before the padding must be zero. */
export function base64ToBytes(value: string): Uint8Array | undefined {
  if (value.length === 0 || !BASE64.test(value) || !hasCleanTail(value)) return undefined;
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function hasCleanTail(value: string): boolean {
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  if (padding === 0) return true;
  const last = ALPHABET.indexOf(value[value.length - padding - 1]);
  return (last & (padding === 2 ? 0b1111 : 0b11)) === 0;
}
