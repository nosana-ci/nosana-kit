import { spawnSync } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { generateSshKeyPair } from '../keyPair.js';
import { isValidSshPublicKey } from '../publicKeys.js';

const deterministicCrypto = {
  getRandomValues<T extends ArrayBufferView>(array: T): T {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    bytes.forEach((_, index) => {
      bytes[index] = (index * 17 + 23) & 0xff;
    });
    return array;
  },
};

const sshKeygenAvailable = spawnSync('ssh-keygen', ['-?']).error === undefined;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('generateSshKeyPair', () => {
  it('produces a valid public key line and a PEM private key', async () => {
    const pair = await generateSshKeyPair({ cryptoProvider: deterministicCrypto });

    expect(pair.algorithm).toBe('ssh-ed25519');
    expect(pair.publicKey).toMatch(/^ssh-ed25519 [A-Za-z0-9+/=]+ nosana$/);
    expect(isValidSshPublicKey(pair.publicKey)).toBe(true);
    expect(pair.privateKey).toMatch(
      /^-----BEGIN OPENSSH PRIVATE KEY-----\n[A-Za-z0-9+/=\n]+-----END OPENSSH PRIVATE KEY-----\n$/
    );
  });

  it('keeps the comment to one word', async () => {
    const pair = await generateSshKeyPair({
      comment: '  nosana   dashboard ',
      cryptoProvider: deterministicCrypto,
    });
    expect(pair.publicKey.endsWith(' nosana-dashboard')).toBe(true);
    expect(isValidSshPublicKey(pair.publicKey)).toBe(true);
  });

  it('is deterministic for a fixed random source and uses the real one by default', async () => {
    const first = await generateSshKeyPair({ cryptoProvider: deterministicCrypto });
    const second = await generateSshKeyPair({ cryptoProvider: deterministicCrypto });
    const real = await generateSshKeyPair();

    expect(second).toEqual(first);
    expect(real.publicKey).not.toBe(first.publicKey);
  });

  it('refuses to generate keys without secure randomness', async () => {
    await expect(generateSshKeyPair({ cryptoProvider: {} as never })).rejects.toThrow(
      'Secure SSH key generation is not supported'
    );
  });

  it.skipIf(!sshKeygenAvailable)(
    'writes a private key that ssh-keygen derives the public key from',
    async () => {
      const pair = await generateSshKeyPair({ cryptoProvider: deterministicCrypto });
      const directory = await mkdtemp(join(tmpdir(), 'nosana-ssh-'));
      temporaryDirectories.push(directory);
      const privateKeyPath = join(directory, 'id_ed25519');
      await writeFile(privateKeyPath, pair.privateKey);
      await chmod(privateKeyPath, 0o600);

      const derived = spawnSync('ssh-keygen', ['-y', '-f', privateKeyPath], { encoding: 'utf8' });

      expect(derived.status).toBe(0);
      expect(derived.stdout.trim().split(/\s+/).slice(0, 2)).toEqual(
        pair.publicKey.split(/\s+/).slice(0, 2)
      );
    }
  );
});
