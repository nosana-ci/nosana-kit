import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';

export async function stopNodeJobOperation(
  client: NodeClient,
  job: string,
  group: string,
  op: string,
): Promise<void> {
  const { data, error, response } = await client.POST('/job/{job}/group/{group}/operation/{op}/stop', {
    params: { path: { job, group, op } },
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to stop operation', error, response);
  }
}
