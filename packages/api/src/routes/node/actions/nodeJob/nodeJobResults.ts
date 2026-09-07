import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { FlowState } from '@nosana/types';
import type { NodeClient } from '../../../../client/node/index.js';

export async function nodeJobResults(client: NodeClient, job: string): Promise<FlowState> {
  const { data, error, response } = await client.GET('/job/{job}/results', { params: { path: { job } } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get job results', error, response);
  }
  return data;
}
