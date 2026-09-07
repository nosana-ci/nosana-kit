import { openNodeSocket } from './socket.js';

import type {
  NodeJobContext,
  NodeSocketOptions,
  NodeStreamHandlers,
  NodeStreamSubscription,
} from '../../types.js';

export function nodeJobStatus(
  context: NodeJobContext,
  handlers: NodeStreamHandlers<unknown>,
  options?: NodeSocketOptions,
): NodeStreamSubscription {
  return openNodeSocket(
    context,
    { path: '/status', body: { jobAddress: context.job } },
    handlers,
    (data) => data,
    options,
  );
}
