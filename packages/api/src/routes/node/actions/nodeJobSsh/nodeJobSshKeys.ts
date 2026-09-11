import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeSshAuthorizedKey, NodeSshKeyOptions } from '../../types.js';

export async function nodeJobSshKeys(
  client: NodeClient,
  job: string,
  { signal }: NodeSshKeyOptions = {},
): Promise<NodeSshAuthorizedKey[]> {
  const { data, error, response } = await client.GET('/job/{job}/ssh/keys', {
    params: { path: { job } },
    signal,
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get SSH keys', error, response);
  }
  return data.keys;
}
