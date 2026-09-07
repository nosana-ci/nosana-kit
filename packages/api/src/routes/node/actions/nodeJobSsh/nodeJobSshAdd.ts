import { requireSshPublicKey } from '@nosana/ssh';

import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeSshAddKeyOptions, NodeSshAuthorization } from '../../types.js';

/** Grants one key, permanently unless `expiresAt` is set. Validated before anything is sent. */
export async function nodeJobSshAdd(
  client: NodeClient,
  job: string,
  publicKey: string,
  { expiresAt, signal }: NodeSshAddKeyOptions = {},
): Promise<NodeSshAuthorization> {
  const sshPublicKey = requireSshPublicKey(publicKey);
  const expiry = toExpiry(expiresAt);
  const { data, error, response } = await client.POST('/job/{job}/ssh/authorize', {
    params: { path: { job } },
    signal,
    body: expiry === undefined ? { sshPublicKey } : { sshPublicKey, expiresAt: expiry },
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to add SSH key', error, response);
  }
  return data;
}

function toExpiry(expiresAt: Date | undefined): string | undefined {
  if (expiresAt === undefined) return undefined;
  if (!(expiresAt instanceof Date) || !(expiresAt.getTime() > Date.now())) {
    throw new Error('SSH expiry must be a valid future Date.');
  }
  return expiresAt.toISOString();
}
