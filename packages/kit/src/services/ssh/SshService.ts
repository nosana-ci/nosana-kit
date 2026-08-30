import { createNosanaAuthorization } from '@nosana/authorization';
import type { JobDefinition } from '@nosana/types';

import type { Wallet } from '../../types.js';
import { walletToAuthorizationSigner } from '../../utils/walletToAuthorizationSigner.js';
import {
  type AccessAuthorizationProvider,
  resolveAuthorizationSignature,
} from './authorization.js';
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

export interface SshJobAccessOptions {
  job: string;
  node: string;
  nodeDomain: string;
  authorizationProvider?: AccessAuthorizationProvider;
  signal?: AbortSignal;
}

export interface AuthorizeSshKeyOptions extends SshJobAccessOptions {
  sshPublicKey: string;
  /** Omit for access until the key is revoked or the job ends. */
  expiresAt?: Date;
}

/** Convenience wrapper for CLI callers; always requests a temporary key. */
export interface AuthorizeEphemeralSshKeyOptions extends SshJobAccessOptions {
  publicKey: string;
  ttlMs?: number;
  /** @deprecated The node derives its network from the running job. */
  network?: string;
}

export interface SshAuthorizedKey {
  sshPublicKey: string;
  /** ISO 8601 UTC timestamp, omitted for permanent keys. */
  expiresAt?: string;
}

export interface SshAuthorizationResponse {
  authorized: true;
  job: string;
  sshUser: string;
  expiresAt?: string;
}

export interface SshKeysResponse {
  job: string;
  sshUser: string;
  keys: SshAuthorizedKey[];
}

export interface SshRevocationResponse {
  revoked: true;
  job: string;
  sshUser: string;
}

export interface SshService {
  generateKeyPair(options?: GenerateSshKeyPairOptions): Promise<SshKeyPair>;
  isValidPublicKey(value: string): boolean;
  parsePublicKeys(input: string): SshPublicKeyParseResult;
  getPublicKeys(definition: JobDefinition): string[];
  withPublicKeys(definition: JobDefinition, publicKeys: string[]): JobDefinition;
  createConnection(options: SshConnectionOptions): SshConnectionDescriptor;
  authorizeKey(options: AuthorizeSshKeyOptions): Promise<SshAuthorizationResponse>;
  authorizeEphemeralKey(
    options: AuthorizeEphemeralSshKeyOptions
  ): Promise<SshAuthorizationResponse>;
  listKeys(options: SshJobAccessOptions): Promise<SshKeysResponse>;
  revokeKey(
    options: SshJobAccessOptions & { sshPublicKey: string }
  ): Promise<SshRevocationResponse>;
  /** Replaces permanent keys, retaining unrelated temporary CLI grants. */
  replaceKeys(options: SshJobAccessOptions & { publicKeys: string[] }): Promise<SshKeysResponse>;
}

export class SshRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'SshRequestError';
  }
}

function validExpiry(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && Number.isFinite(Date.parse(value)));
}

function publicKey(value: string): string {
  if (typeof value !== 'string' || !isValidSshPublicKey(value) || /[\r\n]/.test(value)) {
    throw new Error('A valid OpenSSH public key is required.');
  }
  return value.trim();
}

export function createSshService(deps: SshServiceDeps): SshService {
  const now = () => (deps.now?.() ?? new Date()).getTime();

  async function request(
    options: SshJobAccessOptions,
    method: string,
    path: string,
    body?: unknown
  ): Promise<Record<string, unknown>> {
    // Reject URL syntax in the node/domain before requesting a wallet signature.
    if (
      !/^[A-Za-z0-9-]+$/.test(options.node) ||
      !/^[A-Za-z0-9.-]+$/.test(options.nodeDomain) ||
      !/^[A-Za-z0-9_-]+$/.test(options.job)
    ) {
      throw new Error('Invalid SSH node, domain, or job.');
    }
    const wallet = deps.getWallet();
    if (!options.authorizationProvider && !wallet) {
      throw new Error('A wallet or authorization provider is required for SSH access.');
    }
    const signer = options.authorizationProvider
      ? (message: Uint8Array) =>
          resolveAuthorizationSignature(
            options.authorizationProvider!,
            new TextDecoder().decode(message)
          )
      : walletToAuthorizationSigner(wallet!);
    // Standard Nosana header. The node checks the signer against the job owner.
    const headers = await createNosanaAuthorization(signer).generateHeaders(options.job);
    headers.set('content-type', 'application/json');
    const fetchImplementation = deps.fetch ?? globalThis.fetch;
    if (!fetchImplementation) throw new Error('Fetch is not available in this runtime.');
    const response = await fetchImplementation(
      `https://${options.node}.${options.nodeDomain}/job/${encodeURIComponent(options.job)}/ssh/${path}`,
      {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options.signal,
        redirect: 'error',
      }
    );
    const payload: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const detail =
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : undefined;
      throw new SshRequestError(
        detail ?? `SSH request failed with status ${response.status}.`,
        response.status
      );
    }
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload) ||
      !('job' in payload) ||
      payload.job !== options.job ||
      !('sshUser' in payload) ||
      payload.sshUser !== `nosana-${options.job}`
    ) {
      throw new Error('Node returned an invalid SSH response.');
    }
    return payload as Record<string, unknown>;
  }

  function keysResponse(payload: Record<string, unknown>): SshKeysResponse {
    if (
      !Array.isArray(payload.keys) ||
      !payload.keys.every(
        (key) =>
          key &&
          typeof key === 'object' &&
          typeof key.sshPublicKey === 'string' &&
          isValidSshPublicKey(key.sshPublicKey) &&
          validExpiry(key.expiresAt)
      )
    ) {
      throw new Error('Node returned an invalid SSH keys response.');
    }
    return payload as unknown as SshKeysResponse;
  }

  async function authorizeKey(options: AuthorizeSshKeyOptions): Promise<SshAuthorizationResponse> {
    const sshPublicKey = publicKey(options.sshPublicKey);
    if (
      options.expiresAt !== undefined &&
      (!(options.expiresAt instanceof Date) ||
        !Number.isFinite(options.expiresAt.getTime()) ||
        options.expiresAt.getTime() <= now())
    ) {
      throw new Error('SSH expiry must be a valid future Date.');
    }
    const expiresAt = options.expiresAt?.toISOString();
    const payload = await request(options, 'POST', 'authorize', {
      sshPublicKey,
      ...(expiresAt === undefined ? {} : { expiresAt }),
    });
    if (
      payload.authorized !== true ||
      !validExpiry(payload.expiresAt) ||
      payload.expiresAt !== expiresAt
    ) {
      throw new Error('Node returned an invalid SSH authorization response.');
    }
    return payload as unknown as SshAuthorizationResponse;
  }

  return {
    generateKeyPair: generateSshKeyPair,
    isValidPublicKey: isValidSshPublicKey,
    parsePublicKeys: parseSshPublicKeys,
    getPublicKeys: getSshPublicKeys,
    withPublicKeys: withSshPublicKeys,
    createConnection: createSshConnection,
    authorizeKey,
    async authorizeEphemeralKey(options) {
      const ttl = options.ttlMs ?? DEFAULT_SSH_AUTHORIZATION_TTL_MS;
      if (!Number.isSafeInteger(ttl) || ttl <= 0)
        throw new Error('SSH authorization TTL must be a positive integer.');
      return authorizeKey({
        ...options,
        sshPublicKey: options.publicKey,
        expiresAt: new Date(now() + ttl),
      });
    },
    async listKeys(options) {
      return keysResponse(await request(options, 'GET', 'keys'));
    },
    async revokeKey(options) {
      const payload = await request(options, 'DELETE', 'keys', {
        sshPublicKey: publicKey(options.sshPublicKey),
      });
      if (payload.revoked !== true)
        throw new Error('Node returned an invalid SSH revocation response.');
      return payload as unknown as SshRevocationResponse;
    },
    async replaceKeys(options) {
      if (!Array.isArray(options.publicKeys))
        throw new Error('Expected an array of SSH public keys.');
      const keys = options.publicKeys.map(publicKey);
      const parsed = parseSshPublicKeys(keys.join('\n'));
      if (parsed.errors.length)
        throw new Error(parsed.errors.map((error) => error.message).join(' '));
      return keysResponse(await request(options, 'PUT', 'keys', { publicKeys: parsed.keys }));
    },
  };
}
