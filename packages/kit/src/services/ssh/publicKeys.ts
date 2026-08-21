import type { JobDefinition } from '@nosana/types';

import { base64ToBytes, readUint32 } from './encoding.js';

export const MAX_SSH_PUBLIC_KEYS = 10;
export const MAX_SSH_PUBLIC_KEY_LINE_LENGTH = 8192;
export const MAX_SSH_PUBLIC_KEYS_BYTES = 64 * 1024;

export const SSH_PUBLIC_KEY_ALGORITHMS = new Set([
  'ssh-ed25519',
  'ssh-rsa',
  'ecdsa-sha2-nistp256',
  'ecdsa-sha2-nistp384',
  'ecdsa-sha2-nistp521',
  'sk-ssh-ed25519@openssh.com',
  'sk-ecdsa-sha2-nistp256@openssh.com',
]);

export type SshPublicKeyParseErrorCode = 'INVALID_KEY' | 'TOO_MANY_KEYS' | 'KEY_SET_TOO_LARGE';

export interface SshPublicKeyParseError {
  code: SshPublicKeyParseErrorCode;
  line?: number;
  message: string;
}

export interface SshPublicKeyParseResult {
  keys: string[];
  errors: SshPublicKeyParseError[];
}

export function isValidSshPublicKey(value: string): boolean {
  const key = value.trim();
  if (!key || key.length > MAX_SSH_PUBLIC_KEY_LINE_LENGTH) return false;

  const parts = key.split(/\s+/);
  if (parts.length < 2 || parts.length > 3) return false;

  const [algorithm, encodedKey, comment] = parts;
  if (!SSH_PUBLIC_KEY_ALGORITHMS.has(algorithm)) return false;
  if (comment && /[\r\n]/.test(comment)) return false;

  const decoded = base64ToBytes(encodedKey);
  if (!decoded || decoded.length < 8) return false;

  const algorithmLength = readUint32(decoded, 0);
  if (!algorithmLength || 4 + algorithmLength >= decoded.length) return false;

  return new TextDecoder().decode(decoded.slice(4, 4 + algorithmLength)) === algorithm;
}

export function parseSshPublicKeys(input: string): SshPublicKeyParseResult {
  const keys: string[] = [];
  const errors: SshPublicKeyParseError[] = [];
  const seen = new Set<string>();

  input.split(/\r?\n/).forEach((line, index) => {
    const key = line.trim();
    if (!key) return;

    if (!isValidSshPublicKey(key)) {
      errors.push({
        code: 'INVALID_KEY',
        line: index + 1,
        message: `Line ${index + 1} is not a valid OpenSSH public key.`,
      });
      return;
    }

    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  });

  if (keys.length > MAX_SSH_PUBLIC_KEYS) {
    errors.push({
      code: 'TOO_MANY_KEYS',
      message: `A job can contain at most ${MAX_SSH_PUBLIC_KEYS} SSH public keys.`,
    });
  }

  const totalBytes = keys.reduce((total, key) => total + new TextEncoder().encode(key).length, 0);
  if (totalBytes > MAX_SSH_PUBLIC_KEYS_BYTES) {
    errors.push({
      code: 'KEY_SET_TOO_LARGE',
      message: `SSH public keys can use at most ${MAX_SSH_PUBLIC_KEYS_BYTES} bytes in total.`,
    });
  }

  return { keys, errors };
}

export function getSshPublicKeys(definition: JobDefinition): string[] {
  const keys = definition.ssh?.public_keys;
  if (!Array.isArray(keys)) return [];
  return keys.filter((key) => typeof key === 'string' && key.trim().length > 0);
}

export function withSshPublicKeys(definition: JobDefinition, publicKeys: string[]): JobDefinition {
  const nextDefinition: JobDefinition = { ...definition };

  if (publicKeys.length > 0) {
    nextDefinition.ssh = {
      ...definition.ssh,
      public_keys: [...publicKeys],
    };
  } else {
    delete nextDefinition.ssh;
  }

  return nextDefinition;
}
