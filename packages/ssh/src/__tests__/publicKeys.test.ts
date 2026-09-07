import { describe, expect, it } from 'vitest';

import { bytesToBase64 } from '../encoding.js';
import {
  getSshKeyIdentity,
  isValidSshPublicKey,
  MAX_SSH_PUBLIC_KEYS,
  parseSshPublicKeys,
  requireSshPublicKey,
  requireSshPublicKeySet,
} from '../publicKeys.js';

const blob = 'AAAAC3NzaC1lZDI1NTE5AAAAIB0XqCL4vLIsYRvd5VmtbOJ8IEKDJpjaVWQ5lmxWVTq5';
const key = `ssh-ed25519 ${blob} user-a`;

const encoder = new TextEncoder();

/** A valid ed25519 key whose blob (and so identity) is unique to `seed`. */
function uniqueKey(seed: number, comment = `key-${seed}`): string {
  const algorithm = encoder.encode('ssh-ed25519');
  const publicKey = Uint8Array.from(
    { length: 32 },
    (_, index) => (index * 7 + seed * 31 + 3) & 0xff
  );
  const bytes = new Uint8Array(4 + algorithm.length + 4 + publicKey.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, algorithm.length);
  bytes.set(algorithm, 4);
  view.setUint32(4 + algorithm.length, publicKey.length);
  bytes.set(publicKey, 8 + algorithm.length);
  return `ssh-ed25519 ${bytesToBase64(bytes)} ${comment}`;
}

describe('isValidSshPublicKey', () => {
  it('accepts a key with or without a comment, ignoring surrounding whitespace', () => {
    expect(isValidSshPublicKey(key)).toBe(true);
    expect(isValidSshPublicKey(`ssh-ed25519 ${blob}`)).toBe(true);
    expect(isValidSshPublicKey(`  ${key}\n`)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['comment with spaces', `${key} extra`],
    ['unknown algorithm', `ssh-dss ${blob}`],
    ['algorithm not matching the blob', `ssh-rsa ${blob}`],
    ['blob that is not base64', 'ssh-ed25519 not*base64'],
    ['blob too short for its declared field', 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5'],
    ['two keys on one line', `${key}\n${key}`],
    ['a key with a trailing line smuggled through a newline', `ssh-ed25519 ${blob}\ninjected`],
    ['line too long', `ssh-ed25519 ${blob} ${'c'.repeat(8192)}`],
  ])('rejects %s', (_label, value) => {
    expect(isValidSshPublicKey(value)).toBe(false);
  });
});

describe('requireSshPublicKey', () => {
  it('returns the trimmed key', () => {
    expect(requireSshPublicKey(` ${key} `)).toBe(key);
  });

  it.each([42, `${key}\n${key}`, 'nope'])('throws for %j', (value) => {
    expect(() => requireSshPublicKey(value)).toThrow('A valid OpenSSH public key is required.');
  });
});

describe('parseSshPublicKeys', () => {
  it('collects keys, skips blank lines and collapses duplicates', () => {
    expect(parseSshPublicKeys(`\n${key}\r\n\n  ${key}  \n`)).toEqual({ keys: [key], errors: [] });
  });

  it('reports every invalid line by number', () => {
    const { keys, errors } = parseSshPublicKeys(`${key}\nbad\n\nworse`);
    expect(keys).toEqual([key]);
    expect(errors).toEqual([
      { code: 'INVALID_KEY', line: 2, message: 'Line 2 is not a valid OpenSSH public key.' },
      { code: 'INVALID_KEY', line: 4, message: 'Line 4 is not a valid OpenSSH public key.' },
    ]);
  });

  it('reports a set with more keys than a job allows', () => {
    const tooMany = Array.from({ length: MAX_SSH_PUBLIC_KEYS + 1 }, (_, index) => uniqueKey(index));
    expect(parseSshPublicKeys(tooMany.join('\n')).errors).toEqual([
      expect.objectContaining({ code: 'TOO_MANY_KEYS' }),
    ]);
  });

  it('reports a set whose total size exceeds the limit', () => {
    const large = Array.from({ length: MAX_SSH_PUBLIC_KEYS }, (_, index) =>
      uniqueKey(index, 'c'.repeat(8000))
    );
    expect(parseSshPublicKeys(large.join('\n')).errors).toEqual([
      expect.objectContaining({ code: 'KEY_SET_TOO_LARGE' }),
    ]);
  });

  it('collapses keys that differ only by comment before counting them', () => {
    const sameKeyManyComments = [
      key,
      ...Array.from({ length: MAX_SSH_PUBLIC_KEYS }, (_, index) => `${key}-${index}`),
    ];
    expect(parseSshPublicKeys(sameKeyManyComments.join('\n'))).toEqual({ keys: [key], errors: [] });
  });
});

describe('getSshKeyIdentity', () => {
  it('is the algorithm and blob, ignoring the comment and surrounding whitespace', () => {
    expect(getSshKeyIdentity(`  ${key}  `)).toBe(`ssh-ed25519 ${blob}`);
    expect(getSshKeyIdentity(`ssh-ed25519 ${blob} someone-else`)).toBe(getSshKeyIdentity(key));
  });
});

describe('requireSshPublicKeySet', () => {
  it('returns the deduplicated set', () => {
    expect(requireSshPublicKeySet([key, ` ${key}`])).toEqual([key]);
    expect(requireSshPublicKeySet([])).toEqual([]);
  });

  it('deduplicates keys that differ only by comment, keeping the first', () => {
    expect(requireSshPublicKeySet([key, `ssh-ed25519 ${blob} user-b`])).toEqual([key]);
  });

  it('throws for a non-array or an invalid member', () => {
    expect(() => requireSshPublicKeySet(key)).toThrow('Expected an array of SSH public keys.');
    expect(() => requireSshPublicKeySet([key, 'invalid'])).toThrow('public key');
  });
});
