import { errorFormatter } from '../../utils/errorFormatter.js';

import type { BlockchainIndexerClient } from '../../client/blockchain-indexer/index.js';
import type { Balance, NosanaCreditsApi } from './types.js';

export * from "./types.js";

export function createNosanaCreditsApi(clients: { blockchainIndexer: BlockchainIndexerClient }): NosanaCreditsApi {
  const { blockchainIndexer: client } = clients;
  return {
    async balance(): Promise<Balance> {
      const { data, error } = await client.GET('/api/credits/balance', {});
      if (error || !data) {
        throw errorFormatter('Failed to fetch balance', error);
      }
      return data;
    }
  };
}

