import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeJobEndpoints } from '../../types.js';

export async function nodeJobEndpoints(client: NodeClient, job: string): Promise<NodeJobEndpoints> {
  const { data, error, response } = await client.GET('/job/{job}/endpoints', { params: { path: { job } } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get endpoints', error, response);
  }
  return data;
}
