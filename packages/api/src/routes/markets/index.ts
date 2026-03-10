import { errorFormatter } from '../../utils/errorFormatter.js';

import type { BlockchainIndexerClient } from '../../client/blockchain-indexer/index.js';
import type { Market, MarketRequiredResources, NosanaMarketsApi } from './types.js';

export * from './types.js';

export function createNosanaMarketsApi(clients: { blockchainIndexer: BlockchainIndexerClient }): NosanaMarketsApi {
  const { blockchainIndexer: client } = clients;
  return {
    async list(): Promise<Market[]> {
      const { data, error } = await client.GET('/api/markets/', {
        params: { query: {} }
      });

      if (error || !data) {
        throw errorFormatter('Failed to fetch markets', error);
      }

      return data;
    },
    async get(market: string): Promise<Market> {
      const { data, error } = await client.GET('/api/markets/{id}/', {
        params: {
          path: { id: market }
        }
      });

      if (error || !data) {
        throw errorFormatter('Failed to fetch market', error);
      }

      return data;
    },
    async getRequiredResources(market: string): Promise<MarketRequiredResources> {
      const { data, error } = await client.GET('/api/markets/{id}/required-resources', {
        params: {
          path: { id: market }
        }
      });

      if (error || !data) {
        throw errorFormatter('Failed to fetch required resources', error);
      }

      return data;
    }
  };
}

