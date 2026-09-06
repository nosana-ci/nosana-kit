import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';

export async function stopNodeJob(client: NodeClient, job: string): Promise<void> {
  const { data, error, response } = await client.POST('/job/{job}/stop', {
    params: { path: { job } },
    parseAs: 'text',
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to stop job', error, response);
  }
}
