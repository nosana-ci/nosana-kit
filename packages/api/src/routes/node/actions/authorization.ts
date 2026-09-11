import type { NodeAuthorizationProvider, NodeJobContext } from '../types.js';

/** A per-call provider wins; otherwise the API's signer must be present. Checked before anything opens. */
export function requireNodeAuthorization(
  context: Pick<NodeJobContext, 'authorize'>,
  provider?: NodeAuthorizationProvider,
): NodeAuthorizationProvider {
  const authorize = provider ?? context.authorize;
  if (!authorize) {
    throw new Error('A wallet or authorization provider is required to connect to a node.');
  }
  return authorize;
}
