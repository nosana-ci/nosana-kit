import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { JobDefinition } from '@nosana/types';
import type { NodeClient } from '../../../../client/node/index.js';

export async function setNodeJobDefinition(
  client: NodeClient,
  job: string,
  definition: JobDefinition,
): Promise<void> {
  const { data, error, response } = await client.POST('/job/{job}/job-definition', {
    params: { path: { job } },
    body: definition,
    parseAs: 'text',
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to send job definition', error, response);
  }
}
