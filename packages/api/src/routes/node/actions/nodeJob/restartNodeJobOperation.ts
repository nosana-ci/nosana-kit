import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';

export async function restartNodeJobOperation(
  client: NodeClient,
  job: string,
  group: string,
  op: string,
): Promise<void> {
  const { data, error, response } = await client.POST('/job/{job}/group/{group}/operation/{op}/restart', {
    params: { path: { job, group, op } },
  });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to restart operation', error, response);
  }
}
