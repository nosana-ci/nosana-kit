import { createAuthenticatedClient } from '../createClient.js';
import { defaultConfig } from '../../defaults/index.js';

import type { paths } from './schema.js';
import type { AuthenticatedClient } from '../type.utils.js';
import type { NosanaNetwork, ApiKeyAuth, SignerAuth, CreateNosanaApiOptions } from '../../types.js';

export type BlockchainIndexerClient = AuthenticatedClient<paths>;

export function createBlockchainIndexerClient(
  environment: NosanaNetwork,
  authParams: ApiKeyAuth | SignerAuth | undefined,
  options?: CreateNosanaApiOptions,
): BlockchainIndexerClient {
  const baseUrl = options?.blockchain_indexer_url || defaultConfig[environment].blockchain_indexer_url;
  return createAuthenticatedClient<paths>(baseUrl, authParams, options);
}

export type { paths } from './schema.js';
