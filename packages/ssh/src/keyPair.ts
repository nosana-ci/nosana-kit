import nacl from 'tweetnacl';

import { bytesToBase64, concatBytes, encodeSshString, encodeUint32 } from './encoding.js';

import type { GenerateSshKeyPairOptions, SshCryptoProvider, SshKeyPair } from './types.js';

export const SSH_ED25519 = 'ssh-ed25519';

const OPENSSH_KEY_MAGIC = 'openssh-key-v1\0';
const OPENSSH_KEY_BLOCK_SIZE = 8;
const DEFAULT_COMMENT = 'nosana';
const PEM_LINE_LENGTH = 64;

const encoder = new TextEncoder();

/** Generates an unencrypted, OpenSSH-formatted Ed25519 key pair. */
export async function generateSshKeyPair(
  options: GenerateSshKeyPairOptions = {}
): Promise<SshKeyPair> {
  const random = randomSource(options.cryptoProvider ?? globalThis.crypto);
  const seed = random(32);
  const { publicKey } = nacl.sign.keyPair.fromSeed(seed);
  const comment = normalizeComment(options.comment);
  const publicKeyBlob = concatBytes(
    encodeSshString(encoder.encode(SSH_ED25519)),
    encodeSshString(publicKey)
  );

  return {
    algorithm: SSH_ED25519,
    publicKey: [SSH_ED25519, bytesToBase64(publicKeyBlob), comment].filter(Boolean).join(' '),
    privateKey: toPem(
      'OPENSSH PRIVATE KEY',
      encodePrivateKey({ seed, publicKey, publicKeyBlob, comment, checkInteger: random(4) })
    ),
  };
}

function randomSource(provider: SshCryptoProvider | undefined): (length: number) => Uint8Array {
  if (typeof provider?.getRandomValues !== 'function') {
    throw new Error('Secure SSH key generation is not supported in this runtime.');
  }
  return (length) => provider.getRandomValues(new Uint8Array(length));
}

/** OpenSSH comments are one word; whitespace would split the key line. */
function normalizeComment(comment: string | undefined): string {
  return (comment ?? DEFAULT_COMMENT).trim().replace(/\s+/g, '-');
}

interface PrivateKeyParts {
  seed: Uint8Array;
  publicKey: Uint8Array;
  publicKeyBlob: Uint8Array;
  comment: string;
  /** Random bytes repeated twice so a decrypting reader can detect a wrong passphrase. */
  checkInteger: Uint8Array;
}

/** The `openssh-key-v1` container holding one unencrypted key. */
function encodePrivateKey(parts: PrivateKeyParts): Uint8Array {
  const privateSection = concatBytes(
    parts.checkInteger,
    parts.checkInteger,
    encodeSshString(encoder.encode(SSH_ED25519)),
    encodeSshString(parts.publicKey),
    encodeSshString(concatBytes(parts.seed, parts.publicKey)),
    encodeSshString(encoder.encode(parts.comment))
  );
  const paddingLength = OPENSSH_KEY_BLOCK_SIZE - (privateSection.length % OPENSSH_KEY_BLOCK_SIZE);
  const padding = Uint8Array.from({ length: paddingLength }, (_, index) => index + 1);

  return concatBytes(
    encoder.encode(OPENSSH_KEY_MAGIC),
    encodeSshString(encoder.encode('none')), // cipher
    encodeSshString(encoder.encode('none')), // key derivation
    encodeSshString(new Uint8Array()), // key derivation options
    encodeUint32(1), // number of keys
    encodeSshString(parts.publicKeyBlob),
    encodeSshString(concatBytes(privateSection, padding))
  );
}

function toPem(label: string, bytes: Uint8Array): string {
  const lines = bytesToBase64(bytes).match(new RegExp(`.{1,${PEM_LINE_LENGTH}}`, 'g')) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----\n`;
}
