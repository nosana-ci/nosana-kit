import { tryParseJson } from '../../../../utils/json.js';
import { requireNodeAuthorization } from '../authorization.js';
import { openOnJobRuntime } from '../../jobRuntime.js';
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
  // Checked now rather than once the runtime client is known, so a missing
  // signer still throws before anything opens.
  requireNodeAuthorization(context, options?.authorizationProvider);
  return openOnJobRuntime(context.runtimeClient, (client) =>
    openNodeSocket(
      { ...context, client },
      { path: '/flog', body: { jobAddress: context.job, ...filter } },
      handlers,
      parseTaskLog,
      options,
    ),
  );
}
