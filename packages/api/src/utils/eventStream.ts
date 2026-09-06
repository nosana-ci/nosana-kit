import { EventSource } from 'eventsource';

import { tryParseJson } from './json.js';

import type { ClientConnection } from '../client/type.utils.js';
import type { StreamLifecycleHandlers, StreamSubscription } from '../types.js';

export interface EventStreamHandlers extends StreamLifecycleHandlers {
  /** One parsed frame. Frames that are not JSON are dropped before this. */
  onMessage: (frame: unknown) => void;
}

/**
 * Opens a server-sent event stream addressed and authenticated exactly as an
 * ordinary request on the same connection. `EventSource` reconnects by itself,
 * so errors are reported rather than thrown and `onOpen` may fire more than
 * once. A handler that throws is swallowed with the malformed frames, the
 * price of never letting one bad frame end the stream.
 */
export function openEventStream(
  connection: ClientConnection,
  path: string,
  handlers: EventStreamHandlers,
): StreamSubscription {
  const { baseUrl, headers, credentials } = connection;
  const source = new EventSource(`${baseUrl}${path}`, {
    fetch: async (input, init) =>
      fetch(input, {
        ...init,
        // Under cookie auth there are no headers to copy, so the stream has to
        // opt into sending the cookie or it authenticates as nobody.
        ...(credentials ? { credentials } : {}),
        headers: { ...init.headers, ...(await headers()) },
      }),
  });

  source.onopen = () => handlers.onOpen?.();
  source.onerror = (error) => handlers.onError?.(error);
  source.onmessage = ({ data }) => {
    const frame = tryParseJson(data);
    if (frame === undefined) return;
    try {
      handlers.onMessage(frame);
    } catch {
      return;
    }
  };

  return { close: () => source.close() };
}
