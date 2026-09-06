import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeOperationStatuses } from '../../types.js';

export async function nodeJobOperations(client: NodeClient, job: string): Promise<NodeOperationStatuses> {
  const { data, error, response } = await client.GET('/job/{job}/ops', { params: { path: { job } } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get operations', error, response);
  }
  return data;
}
