import nacl from 'tweetnacl';

import { bytesToBase64, concatBytes, encodeSshField, encodeUint32 } from './encoding.js';

const SSH_ED25519 = 'ssh-ed25519';
const OPENSSH_PRIVATE_KEY_MAGIC = 'openssh-key-v1\0';
const OPENSSH_PRIVATE_KEY_BLOCK_SIZE = 8;

export interface SshCryptoProvider {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

export interface GenerateSshKeyPairOptions {
  comment?: string;
  cryptoProvider?: SshCryptoProvider;
}

export interface SshKeyPair {
  algorithm: typeof SSH_ED25519;
  publicKey: string;
  privateKey: string;
}

function randomBytes(provider: SshCryptoProvider | undefined, length: number): Uint8Array {
  if (!provider || typeof provider.getRandomValues !== 'function') {
    throw new Error('Secure SSH key generation is not supported in this runtime.');
  }

  return provider.getRandomValues(new Uint8Array(length));
}

function toPem(label: string, value: Uint8Array): string {
  const base64 = bytesToBase64(value);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}

function encodeOpenSshPrivateKey({
  seed,
  publicKey,
  publicKeyBlob,
  comment,
  cryptoProvider,
}: {
  seed: Uint8Array;
  publicKey: Uint8Array;
  publicKeyBlob: Uint8Array;
  comment: string;
  cryptoProvider: SshCryptoProvider;
}): Uint8Array {
  const encoder = new TextEncoder();
  const keyType = encoder.encode(SSH_ED25519);
  const checkInteger = randomBytes(cryptoProvider, 4);
  const privateKeyMaterial = concatBytes(seed, publicKey);
  const privateFields = concatBytes(
    checkInteger,
    checkInteger,
    encodeSshField(keyType),
    encodeSshField(publicKey),
    encodeSshField(privateKeyMaterial),
    encodeSshField(encoder.encode(comment))
  );
  const paddingLength =
    OPENSSH_PRIVATE_KEY_BLOCK_SIZE - (privateFields.length % OPENSSH_PRIVATE_KEY_BLOCK_SIZE);
  const padding = Uint8Array.from({ length: paddingLength }, (_, index) => index + 1);

  return concatBytes(
    encoder.encode(OPENSSH_PRIVATE_KEY_MAGIC),
    encodeSshField(encoder.encode('none')),
    encodeSshField(encoder.encode('none')),
    encodeSshField(new Uint8Array()),
    encodeUint32(1),
    encodeSshField(publicKeyBlob),
    encodeSshField(concatBytes(privateFields, padding))
  );
}

/** Generate an unencrypted OpenSSH-compatible Ed25519 key pair. */
export async function generateSshKeyPair(
  options: GenerateSshKeyPairOptions = {}
): Promise<SshKeyPair> {
  const cryptoProvider = options.cryptoProvider ?? globalThis.crypto;
  const seed = randomBytes(cryptoProvider, 32);
  const keyPair = nacl.sign.keyPair.fromSeed(seed);
  const encoder = new TextEncoder();
  const publicKeyBlob = concatBytes(
    encodeSshField(encoder.encode(SSH_ED25519)),
    encodeSshField(keyPair.publicKey)
  );
  const comment = String(options.comment ?? 'nosana')
    .trim()
    .replace(/\s+/g, '-');
  const privateKey = encodeOpenSshPrivateKey({
    seed,
    publicKey: keyPair.publicKey,
    publicKeyBlob,
    comment,
    cryptoProvider,
  });

  return {
    algorithm: SSH_ED25519,
    publicKey: `${SSH_ED25519} ${bytesToBase64(publicKeyBlob)}${comment ? ` ${comment}` : ''}`,
    privateKey: toPem('OPENSSH PRIVATE KEY', privateKey),
  };
}
