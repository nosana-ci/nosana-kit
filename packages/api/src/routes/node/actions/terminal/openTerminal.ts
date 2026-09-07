import { requireNodeAuthorization } from '../authorization.js';
import { openNodeWebSocket } from '../nodeSocket/index.js';
import { createTerminalAuthorizationGrant } from './grant.js';
import { openTerminalSession } from './session.js';

import type { NodeJobContext, NodeTerminalOptions, TerminalSession } from '../../types.js';

/** Signs a short-lived grant for the job, then hands a fresh WebSocket to a session. */
export async function openNodeJobTerminal(
  context: NodeJobContext,
  options: NodeTerminalOptions,
): Promise<TerminalSession> {
  options.signal?.throwIfAborted();
  const authorize = requireNodeAuthorization(context, options.authorizationProvider);
  options.onStatus?.('authorizing');

  const authorization = await createTerminalAuthorizationGrant({
    job: context.job,
    node: context.node,
    network: context.environment,
    op: options.op,
    ttlMs: options.ttlMs,
    authorize,
  });
  options.signal?.throwIfAborted();

  const socket = openNodeWebSocket(context.client, '/terminal', options.webSocketFactory);
  return openTerminalSession(socket, context.job, authorization, options);
}
