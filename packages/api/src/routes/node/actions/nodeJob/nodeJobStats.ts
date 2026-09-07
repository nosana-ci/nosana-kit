import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeStatsQuery, NodeTaskStat } from '../../types.js';

export async function nodeJobStats(
  client: NodeClient,
  job: string,
  query: NodeStatsQuery = {},
): Promise<NodeTaskStat[]> {
  const { data, error, response } = await client.GET('/job/{job}/stats', { params: { path: { job }, query } });
  if ((error !== undefined && error !== null) || data === undefined) {
    throw errorFormatter('Failed to get stats', error, response);
  }
  return data;
}
