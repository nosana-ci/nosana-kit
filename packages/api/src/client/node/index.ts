import { isSolanaAddress } from '@nosana/types';

import { createAuthenticatedClient } from '../createClient.js';
import { defaultConfig } from '../../defaults/index.js';

import type { NodeApiSchema } from '@nosana/types';
import type { AuthenticatedClient, ClientConnection } from '../type.utils.js';
import type { CreateNosanaApiOptions, NosanaNetwork, SignedHeaderAuth } from '../../types.js';

/** The node's routes, generated in `@nosana/types` from `openapi/node.openapi.json`. */
type paths = NodeApiSchema.paths;

/** A node's API client, with the `connection` its streams and sockets are opened from. */
export type NodeClient = AuthenticatedClient<paths> & { connection: ClientConnection };

/** The domain a network's nodes answer under, unless overridden. */
export function nodeDomain(environment: NosanaNetwork, options?: CreateNosanaApiOptions): string {
  return options?.node_domain ?? defaultConfig[environment].node_domain;
}

/** Where one node's API answers: its address as a subdomain of the network's node domain. */
export function nodeUrl(
  environment: NosanaNetwork,
  address: string,
  options?: CreateNosanaApiOptions,
): string {
  if (!isSolanaAddress(address)) throw new Error(`Invalid node address: ${address}`);
  return `https://${address}.${nodeDomain(environment, options)}`;
}

/**
 * Every node runs the same API on its own host, so unlike the hosted services
 * there is one client per node. Nodes verify the job owner's wallet signature
 * over the `authorization` header, so a bare API key means nothing to them: the
 * caller travels as a header signer — a wallet directly, or, under API-key auth,
 * one backed by the client manager's signing service.
 */
export function createNodeClient(
  environment: NosanaNetwork,
  address: string,
  authParams: SignedHeaderAuth | undefined,
  options?: CreateNosanaApiOptions,
): NodeClient {
  return createAuthenticatedClient<paths>(nodeUrl(environment, address, options), authParams);
}
