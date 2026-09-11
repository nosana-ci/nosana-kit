import { requireSshPublicKey } from '@nosana/ssh';

import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeSshKeyOptions, NodeSshRevocation } from '../../types.js';

export async function nodeJobSshRemove(
  client: NodeClient,
  job: string,
  publicKey: string,
  { signal }: NodeSshKeyOptions = {},
): Promise<NodeSshRevocation> {
  const { data, error, response } = await client.DELETE('/job/{job}/ssh/keys', {
    params: { path: { job } },
    signal,
    body: { sshPublicKey: requireSshPublicKey(publicKey) },
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to remove SSH key', error, response);
  }
  return data;
}
