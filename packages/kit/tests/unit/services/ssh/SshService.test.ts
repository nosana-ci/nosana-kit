import { mkdtemp, rm, writeFile, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import type { JobDefinition } from '@nosana/types';

import {
  createSshService,
  generateSshKeyPair,
  isValidSshPublicKey,
  parseSshPublicKeys,
  withSshPublicKeys,
} from '../../../../src/services/ssh/index.js';

const temporaryDirectories: string[] = [];

const deterministicCrypto = {
  getRandomValues<T extends ArrayBufferView>(array: T): T {
    const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    bytes.forEach((_, index) => {
      bytes[index] = (index * 17 + 23) & 0xff;
    });
    return array;
  },
};

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});

describe('SSH access service', () => {
  it('generates a matching OpenSSH Ed25519 key pair', async () => {
    const pair = await generateSshKeyPair({
      comment: 'nosana dashboard',
      cryptoProvider: deterministicCrypto,
    });

    expect(pair.publicKey).toContain(' nosana-dashboard');
    expect(isValidSshPublicKey(pair.publicKey)).toBe(true);
    expect(pair.privateKey).toMatch(
      /^-----BEGIN OPENSSH PRIVATE KEY-----\n[A-Za-z0-9+/=\n]+-----END OPENSSH PRIVATE KEY-----\n$/
    );

    const directory = await mkdtemp(join(tmpdir(), 'nosana-kit-ssh-'));
    temporaryDirectories.push(directory);
    const privateKeyPath = join(directory, 'id_ed25519');
    await writeFile(privateKeyPath, pair.privateKey);
    await chmod(privateKeyPath, 0o600);

    const derived = spawnSync('ssh-keygen', ['-y', '-f', privateKeyPath], {
      encoding: 'utf8',
    });
    expect(derived.status).toBe(0);
    expect(derived.stdout.trim().split(/\s+/).slice(0, 2)).toEqual(
      pair.publicKey.split(/\s+/).slice(0, 2)
    );
  });

  it('matches the node public-key validation and collection limits', async () => {
    const pair = await generateSshKeyPair({ cryptoProvider: deterministicCrypto });
    const withSpaceInComment = `${pair.publicKey} extra`;

    expect(isValidSshPublicKey(withSpaceInComment)).toBe(false);
    expect(parseSshPublicKeys(`${pair.publicKey}\n${pair.publicKey}`)).toEqual({
      keys: [pair.publicKey],
      errors: [],
    });

    const tooMany = Array.from({ length: 11 }, (_, index) =>
      pair.publicKey.replace(/ nosana$/, ` key-${index}`)
    ).join('\n');
    expect(parseSshPublicKeys(tooMany).errors).toContainEqual(
      expect.objectContaining({ code: 'TOO_MANY_KEYS' })
    );
  });

  it('updates job definitions without mutating the original', async () => {
    const definition = {
      version: '0.1',
      type: 'container',
      ops: [],
    } as unknown as JobDefinition;
    const pair = await generateSshKeyPair({ cryptoProvider: deterministicCrypto });
    const updated = withSshPublicKeys(definition, [pair.publicKey]);

    expect(definition.ssh).toBeUndefined();
    expect(updated.ssh?.public_keys).toEqual([pair.publicKey]);
    expect(withSshPublicKeys(updated, []).ssh).toBeUndefined();
  });

  it('builds structured socat and nc SSH connections', () => {
    const service = createSshService({ getWallet: () => undefined });
    const socat = service.createConnection({
      job: 'job-address',
      node: 'node-address',
      nodeDomain: 'node.example.com',
      op: 'worker',
    });
    const nc = service.createConnection({
      job: 'job-address',
      node: 'node-address',
      nodeDomain: 'node.example.com',
      proxyMode: 'nc',
    });

    expect(socat.username).toBe('nosana-job-address');
    expect(socat.hostname).toBe('node-address-ssh.node.example.com');
    expect(socat.args).toContain(
      'ProxyCommand=socat - PROXY:node.example.com:%h:%p,proxyport=5002'
    );
    expect(socat.formattedCommand).toContain(
      "'ProxyCommand=socat - PROXY:node.example.com:%h:%p,proxyport=5002'"
    );
    expect(nc.proxyCommand).toBe('nc -X connect -x node.example.com:5002 %h %p');
  });
});
