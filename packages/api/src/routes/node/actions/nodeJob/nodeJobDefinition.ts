import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { JobDefinition } from '@nosana/types';
import type { NodeClient } from '../../../../client/node/index.js';

export async function nodeJobDefinition(client: NodeClient, job: string): Promise<JobDefinition> {
  const { data, error, response } = await client.GET('/job/{job}/job-definition', { params: { path: { job } } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get job definition', error, response);
  }
  return data;
}
