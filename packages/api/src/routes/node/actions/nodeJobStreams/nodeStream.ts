import { openEventStream } from '../../../../utils/eventStream.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type { NodeStreamHandlers, NodeStreamSubscription } from '../../types.js';

/** The node's streams carry one typed frame per message; the shape is taken on trust from the schema. */
export function nodeStream<T>(
  client: NodeClient,
  path: string,
  handlers: NodeStreamHandlers<T>,
): NodeStreamSubscription {
  return openEventStream(client.connection, path, {
    onOpen: handlers.onOpen,
    onError: handlers.onError,
    onMessage: (frame) => handlers.onData(frame as T),
  });
}
