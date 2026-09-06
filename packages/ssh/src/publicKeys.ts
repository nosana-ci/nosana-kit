import { base64ToBytes, readUint32 } from './encoding.js';

import type { SshPublicKeyParseError, SshPublicKeyParseResult } from './types.js';

export const MAX_SSH_PUBLIC_KEYS = 10;
export const MAX_SSH_PUBLIC_KEY_LINE_LENGTH = 8192;
export const MAX_SSH_PUBLIC_KEYS_BYTES = 64 * 1024;

export const SSH_PUBLIC_KEY_ALGORITHMS: ReadonlySet<string> = new Set([
  'ssh-ed25519',
  'ssh-rsa',
  'ecdsa-sha2-nistp256',
  'ecdsa-sha2-nistp384',
  'ecdsa-sha2-nistp521',
  'sk-ssh-ed25519@openssh.com',
  'sk-ecdsa-sha2-nistp256@openssh.com',
]);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Whether `value` is one OpenSSH public-key line: a supported algorithm, a
 * base64 blob that names the same algorithm, and at most one comment word.
 */
export function isValidSshPublicKey(value: string): boolean {
  const key = value.trim();
  if (!key || key.length > MAX_SSH_PUBLIC_KEY_LINE_LENGTH) return false;
  // One line only: an embedded newline could smuggle a second authorized_keys entry.
  if (/[\r\n]/.test(key)) return false;

  const [algorithm, blob, , ...rest] = key.split(/\s+/);
  if (rest.length > 0 || !blob || !SSH_PUBLIC_KEY_ALGORITHMS.has(algorithm)) return false;
  return blobAlgorithm(blob) === algorithm;
}

/**
 * A key's identity for deduplication and revocation: its algorithm and blob,
 * with the comment dropped. Two lines that differ only by comment name the
 * same key, so both the node and the client collapse them to one.
 */
export function getSshKeyIdentity(key: string): string {
  return key.trim().split(/\s+/).slice(0, 2).join(' ');
}

/** The algorithm name an OpenSSH public-key blob declares in its first field. */
function blobAlgorithm(blob: string): string | undefined {
  const bytes = base64ToBytes(blob);
  if (!bytes) return undefined;
  const length = readUint32(bytes, 0);
  if (!length || 4 + length >= bytes.length) return undefined;
  return decoder.decode(bytes.subarray(4, 4 + length));
}

/** Returns the trimmed key, or throws when `value` is not exactly one valid OpenSSH public key. */
export function requireSshPublicKey(value: unknown): string {
  if (typeof value !== 'string' || !isValidSshPublicKey(value)) {
    throw new Error('A valid OpenSSH public key is required.');
  }
  return value.trim();
}

/**
 * Parses one key per line. Blank lines are skipped and duplicates collapsed;
 * every problem is reported rather than thrown so callers can show them all.
 */
export function parseSshPublicKeys(input: string): SshPublicKeyParseResult {
  const keys: string[] = [];
  const errors: SshPublicKeyParseError[] = [];

  input.split(/\r?\n/).forEach((line, index) => {
    const key = line.trim();
    if (!key) return;
    if (isValidSshPublicKey(key)) {
      keys.push(key);
    } else {
      errors.push({
        code: 'INVALID_KEY',
        line: index + 1,
        message: `Line ${index + 1} is not a valid OpenSSH public key.`,
      });
    }
  });

  return collectSshPublicKeys(keys, errors);
}

/** Validates a key set the way the node does, throwing with every problem found. */
export function requireSshPublicKeySet(values: unknown): string[] {
  if (!Array.isArray(values)) throw new Error('Expected an array of SSH public keys.');
  const { keys, errors } = collectSshPublicKeys(values.map(requireSshPublicKey));
  if (errors.length > 0) throw new Error(errors.map((error) => error.message).join(' '));
  return keys;
}

/** Deduplicates keys that are already valid and reports the set limits the node enforces. */
function collectSshPublicKeys(
  keys: string[],
  errors: SshPublicKeyParseError[] = []
): SshPublicKeyParseResult {
  const byIdentity = new Map<string, string>();
  for (const key of keys) {
    const identity = getSshKeyIdentity(key);
    if (!byIdentity.has(identity)) byIdentity.set(identity, key);
  }
  const unique = [...byIdentity.values()];

  if (unique.length > MAX_SSH_PUBLIC_KEYS) {
    errors.push({
      code: 'TOO_MANY_KEYS',
      message: `A job can contain at most ${MAX_SSH_PUBLIC_KEYS} SSH public keys.`,
    });
  }

  const totalBytes = unique.reduce((total, key) => total + encoder.encode(key).length, 0);
  if (totalBytes > MAX_SSH_PUBLIC_KEYS_BYTES) {
    errors.push({
      code: 'KEY_SET_TOO_LARGE',
      message: `SSH public keys can use at most ${MAX_SSH_PUBLIC_KEYS_BYTES} bytes in total.`,
    });
  }

  return { keys: unique, errors };
}
