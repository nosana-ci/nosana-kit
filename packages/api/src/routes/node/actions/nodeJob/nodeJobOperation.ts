import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';

export async function nodeJobOperation(client: NodeClient, job: string, op: string): Promise<string> {
  const { data, error, response } = await client.GET('/job/{job}/ops/{op}', { params: { path: { job, op } } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get operation', error, response);
  }
  return data;
}
