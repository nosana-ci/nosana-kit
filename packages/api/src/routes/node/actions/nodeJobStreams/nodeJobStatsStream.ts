import { nodeStream } from './nodeStream.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeStatsQuery, NodeStreamHandlers, NodeStreamSubscription, NodeTaskStat } from '../../types.js';

export function nodeJobStatsStream(
  client: NodeClient,
  job: string,
  handlers: NodeStreamHandlers<NodeTaskStat[]>,
  { interval }: Pick<NodeStatsQuery, 'interval'> = {},
): NodeStreamSubscription {
  const query = interval === undefined ? '' : `?interval=${encodeURIComponent(interval)}`;
  return nodeStream(client, `/job/${encodeURIComponent(job)}/stats/stream${query}`, handlers);
}
