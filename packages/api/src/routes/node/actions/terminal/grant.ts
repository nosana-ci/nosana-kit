import { parseAuthorization } from '@nosana/authorization';
import {
  bytesToBase64,
  buildTerminalAuthorizationMessage,
  isSafeTerminalOperation,
  TERMINAL_AUTHORIZATION_AUDIENCE,
  TERMINAL_AUTHORIZATION_MAX_TTL_MS,
  TERMINAL_AUTHORIZATION_MESSAGE_HEADER,
} from '@nosana/ssh';

import type { NodeAuthorizationProvider, TerminalAuthorizationGrant } from '../../types.js';

// The message contract now lives in @nosana/ssh, shared with the node; re-exported
// here so existing importers of this module keep resolving it.
export {
  buildTerminalAuthorizationMessage,
  isSafeTerminalOperation,
  TERMINAL_AUTHORIZATION_AUDIENCE,
  TERMINAL_AUTHORIZATION_MAX_TTL_MS,
  TERMINAL_AUTHORIZATION_MESSAGE_HEADER,
};
export type { TerminalAuthorizationMessageOptions } from '@nosana/ssh';

export const DEFAULT_TERMINAL_AUTHORIZATION_TTL_MS = 4 * 60 * 1000;

export interface CreateTerminalAuthorizationGrantOptions {
  job: string;
  node: string;
  network: string;
  op?: string;
  ttlMs?: number;
  now?: Date;
  authorize: NodeAuthorizationProvider;
}

/**
 * Signs a short-lived grant for one terminal session on one job. The node
 * verifies the raw signature over the message, so it is pulled back out of
 * the `message:signature` authorization string the signer produces.
 */
export async function createTerminalAuthorizationGrant({
  job,
  node,
  network,
  op,
  ttlMs = DEFAULT_TERMINAL_AUTHORIZATION_TTL_MS,
  now = new Date(),
  authorize,
}: CreateTerminalAuthorizationGrantOptions): Promise<TerminalAuthorizationGrant> {
  if (ttlMs <= 0 || ttlMs > TERMINAL_AUTHORIZATION_MAX_TTL_MS) {
    throw new Error(
      `Terminal authorization TTL must be between 1 and ${TERMINAL_AUTHORIZATION_MAX_TTL_MS} milliseconds.`,
    );
  }
  if (op && !isSafeTerminalOperation(op)) {
    throw new Error('Invalid terminal operation selector.');
  }

  const expiresAt = new Date(now.getTime() + ttlMs).toISOString();
  const message = buildTerminalAuthorizationMessage({ job, node, expiresAt, op, network });
  // A grant is scoped to this job, operation and expiry. It must neither reuse
  // a cached API authentication header nor replace one in a wallet's store.
  const { signature } = parseAuthorization(await authorize(message, { skipCache: true }), {
    expected_message: message,
  });

  return { message, signature: bytesToBase64(signature), expiresAt };
}
