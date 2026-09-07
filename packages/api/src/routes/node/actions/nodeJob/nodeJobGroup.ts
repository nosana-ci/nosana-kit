import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeOperationStatuses } from '../../types.js';

export async function nodeJobGroup(
  client: NodeClient,
  job: string,
  group?: string,
): Promise<NodeOperationStatuses> {
  const { data, error, response } =
    group === undefined
      ? await client.GET('/job/{job}/group/current', { params: { path: { job } } })
      : await client.GET('/job/{job}/group/{group}', { params: { path: { job, group } } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter(group === undefined ? 'Failed to get current group' : 'Failed to get group', error, response);
  }
  return data;
}
