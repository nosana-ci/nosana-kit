import { tryParseJson } from '../../../../utils/json.js';
import { requireNodeAuthorization } from '../authorization.js';

import type { NodeClient } from '../../../../client/node/index.js';
import type {
  NodeJobContext,
  NodeSocketOptions,
  NodeStreamHandlers,
  NodeStreamSubscription,
} from '../../types.js';

/**
 * The node multiplexes its WebSocket routes over one endpoint: the first
 * frame is a JSON handshake naming the route, carrying the authorization
 * string and the route's body, and every frame after that is `{ path, data }`.
 */
export interface NodeSocketHandshake {
  path: '/log' | '/flog' | '/status';
  body: { jobAddress: string } & Record<string, unknown>;
}

/** The node's WebSocket endpoint, derived from the client's HTTP base URL. */
export function nodeSocketUrl(client: NodeClient, path = ''): string {
  return `${client.connection.baseUrl.replace(/^http/, 'ws')}${path}`;
}

/** A fresh socket to the node, from the caller's factory or the runtime's `WebSocket`. */
export function openNodeWebSocket(
  client: NodeClient,
  path: string,
  factory: (url: string) => WebSocket = (url) => new WebSocket(url),
): WebSocket {
  return factory(nodeSocketUrl(client, path));
}

export function openNodeSocket<T>(
  context: NodeJobContext,
  handshake: NodeSocketHandshake,
  handlers: NodeStreamHandlers<T>,
  parse: (data: unknown) => T | undefined,
  options: NodeSocketOptions = {},
): NodeStreamSubscription {
  const authorize = requireNodeAuthorization(context, options.authorizationProvider);
  const socket = openNodeWebSocket(context.client, '', options.webSocketFactory);

  socket.onopen = async () => {
    try {
      // Bind the socket's header to the job it opens, so a captured handshake
      // cannot be replayed against another job (matches the REST/SSE routes).
      const header = await authorize(handshake.body.jobAddress, { skipCache: true });
      socket.send(JSON.stringify({ ...handshake, header }));
      handlers.onOpen?.();
    } catch (error) {
      handlers.onError?.(error);
      socket.close();
    }
  };
  socket.onmessage = (event: MessageEvent) => {
    if (typeof event.data !== 'string') return;
    const frame = tryParseJson(event.data) as { data?: unknown } | null | undefined;
    if (typeof frame !== 'object' || frame === null) return;
    const data = parse(frame.data);
    if (data !== undefined) handlers.onData(data);
  };
  socket.onerror = (event: Event) => handlers.onError?.(event);
  socket.onclose = () => handlers.onClose?.();

  return { close: () => socket.close() };
}
