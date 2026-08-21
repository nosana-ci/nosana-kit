import type { JobDefinition } from '@nosana/types';

import type { Wallet } from '../../types.js';
import { walletToAuthorizationSigner } from '../../utils/walletToAuthorizationSigner.js';
import {
  type AccessAuthorizationProvider,
  buildSshAuthorizationMessage,
  resolveAuthorizationSignature,
  SSH_AUTHORIZATION_MAX_TTL_MS,
} from './authorization.js';
import { bytesToBase64 } from './encoding.js';
import {
  createSshConnection,
  type SshConnectionDescriptor,
  type SshConnectionOptions,
} from './connection.js';
import { generateSshKeyPair, type GenerateSshKeyPairOptions, type SshKeyPair } from './keys.js';
import {
  getSshPublicKeys,
  isValidSshPublicKey,
  parseSshPublicKeys,
  type SshPublicKeyParseResult,
  withSshPublicKeys,
} from './publicKeys.js';

const DEFAULT_SSH_AUTHORIZATION_TTL_MS = 4 * 60 * 1000;

export interface SshServiceDeps {
  getWallet: () => Wallet | undefined;
  fetch?: typeof fetch;
  now?: () => Date;
}

export interface AuthorizeEphemeralSshKeyOptions {
  job: string;
  node: string;
  nodeDomain: string;
  network: string;
  publicKey: string;
  ttlMs?: number;
  authorizationProvider?: AccessAuthorizationProvider;
  signal?: AbortSignal;
}

export interface SshAuthorizationResponse {
  authorized: true;
  job: string;
  sshUser: string;
  expiresAt: string;
}

export interface SshService {
  generateKeyPair(options?: GenerateSshKeyPairOptions): Promise<SshKeyPair>;
  isValidPublicKey(value: string): boolean;
  parsePublicKeys(input: string): SshPublicKeyParseResult;
  getPublicKeys(definition: JobDefinition): string[];
  withPublicKeys(definition: JobDefinition, publicKeys: string[]): JobDefinition;
  createConnection(options: SshConnectionOptions): SshConnectionDescriptor;
  authorizeEphemeralKey(
    options: AuthorizeEphemeralSshKeyOptions
  ): Promise<SshAuthorizationResponse>;
}

function isSshAuthorizationResponse(value: unknown): value is SshAuthorizationResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Partial<SshAuthorizationResponse>;
  return (
    response.authorized === true &&
    typeof response.job === 'string' &&
    typeof response.sshUser === 'string' &&
    typeof response.expiresAt === 'string'
  );
}

export function createSshService(deps: SshServiceDeps): SshService {
  const getDefaultAuthorizationProvider = (): AccessAuthorizationProvider => {
    const wallet = deps.getWallet();
    if (!wallet) {
      throw new Error('A wallet or authorization provider is required for SSH access.');
    }

    const signMessage = walletToAuthorizationSigner(wallet);
    return (message) => signMessage(new TextEncoder().encode(message));
  };

  return {
    generateKeyPair: generateSshKeyPair,
    isValidPublicKey: isValidSshPublicKey,
    parsePublicKeys: parseSshPublicKeys,
    getPublicKeys: getSshPublicKeys,
    withPublicKeys: withSshPublicKeys,
    createConnection: createSshConnection,

    async authorizeEphemeralKey(options): Promise<SshAuthorizationResponse> {
      if (!isValidSshPublicKey(options.publicKey)) {
        throw new Error('A valid OpenSSH public key is required.');
      }

      const ttlMs = options.ttlMs ?? DEFAULT_SSH_AUTHORIZATION_TTL_MS;
      if (ttlMs <= 0 || ttlMs > SSH_AUTHORIZATION_MAX_TTL_MS) {
        throw new Error(
          `SSH authorization TTL must be between 1 and ${SSH_AUTHORIZATION_MAX_TTL_MS} milliseconds.`
        );
      }

      const expiresAt = new Date((deps.now?.() ?? new Date()).getTime() + ttlMs).toISOString();
      const message = buildSshAuthorizationMessage({
        job: options.job,
        node: options.node,
        sshPublicKey: options.publicKey,
        expiresAt,
        network: options.network,
      });
      const provider = options.authorizationProvider ?? getDefaultAuthorizationProvider();
      const signature = await resolveAuthorizationSignature(provider, message);
      const fetchImplementation = deps.fetch ?? globalThis.fetch;
      if (!fetchImplementation) {
        throw new Error('Fetch is not available in this runtime.');
      }

      const response = await fetchImplementation(
        `https://${options.node}.${options.nodeDomain}/job/${encodeURIComponent(options.job)}/ssh/authorize`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            message,
            signature: bytesToBase64(signature),
          }),
          signal: options.signal,
        }
      );
      const payload: unknown = await response.json().catch(() => undefined);

      if (!response.ok) {
        const errorMessage =
          payload &&
          typeof payload === 'object' &&
          'error' in payload &&
          typeof payload.error === 'string'
            ? payload.error
            : undefined;
        throw new Error(errorMessage ?? `SSH authorization failed with status ${response.status}.`);
      }

      if (!isSshAuthorizationResponse(payload)) {
        throw new Error('Node returned an invalid SSH authorization response.');
      }

      return payload;
    },
  };
}
