import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';

export async function stopNodeJobGroup(client: NodeClient, job: string, group: string): Promise<void> {
  const { data, error, response } = await client.POST('/job/{job}/group/{group}/stop', {
    params: { path: { job, group } },
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to stop group', error, response);
  }
}
