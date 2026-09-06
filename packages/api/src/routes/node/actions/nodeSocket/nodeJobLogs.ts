import { tryParseJson } from '../../../../utils/json.js';
import { openNodeSocket } from './socket.js';

import type {
  NodeJobContext,
  NodeLogsFilter,
  NodeSocketOptions,
  NodeStreamHandlers,
  NodeStreamSubscription,
  NodeTaskLog,
} from '../../types.js';

/** Task manager logs arrive JSON-encoded inside the frame's `data`. */
function parseTaskLog(data: unknown): NodeTaskLog | undefined {
  return typeof data === 'string' ? (tryParseJson(data) as NodeTaskLog | undefined) : undefined;
}

export function nodeJobLogs(
  context: NodeJobContext,
  handlers: NodeStreamHandlers<NodeTaskLog>,
  filter: NodeLogsFilter = {},
  options?: NodeSocketOptions,
): NodeStreamSubscription {
  return openNodeSocket(
    context,
    { path: '/flog', body: { jobAddress: context.job, ...filter } },
    handlers,
    parseTaskLog,
    options,
  );
}
