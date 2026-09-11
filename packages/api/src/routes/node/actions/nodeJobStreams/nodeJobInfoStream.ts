import { nodeStream } from './nodeStream.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeJobInfo, NodeStreamHandlers, NodeStreamSubscription } from '../../types.js';

export function nodeJobInfoStream(
  client: NodeClient,
  job: string,
  handlers: NodeStreamHandlers<NodeJobInfo>,
): NodeStreamSubscription {
  return nodeStream(client, `/job/${encodeURIComponent(job)}/info`, handlers);
}
