import { errorFormatter } from '../../utils/errorFormatter.js';
import type { BlockchainIndexerClient } from '../../client/blockchain-indexer/index.js';
import type {
  NosanaStatsApi,
  StatsPriceRequest,
  StatsHistoryRequest,
} from './types.js';

export type { NosanaStatsApi } from './types.js';

interface StatsRouteClients {
  blockchainIndexer: BlockchainIndexerClient;
}

export function createNosanaStatsApi(
  clients: StatsRouteClients,
): NosanaStatsApi {
  const { blockchainIndexer } = clients;

  return {
    get: async () => {
      const { data, error } = await blockchainIndexer.GET('/stats/');
      if (error || !data) {
        throw errorFormatter('Error fetching stats', error);
      }
      return data as unknown as Record<string, unknown>;
    },

    getPrice: async (request?: StatsPriceRequest) => {
      const { data, error } = await blockchainIndexer.GET('/stats/price', {
        params: { query: request ?? {} },
      });
      if (error || !data) {
        throw errorFormatter('Error fetching NOS price', error);
      }
      return data;
    },

    getSpendingHistory: async (request: StatsHistoryRequest) => {
      const { data, error } = await blockchainIndexer.GET(
        '/stats/spending-history',
        {
          params: { query: request },
        },
      );
      if (error || !data) {
        throw errorFormatter('Error fetching spending history', error);
      }
      return data as unknown as Record<string, unknown>;
    },

    getEarningHistory: async (request: StatsHistoryRequest) => {
      const { data, error } = await blockchainIndexer.GET(
        '/stats/earning-history',
        {
          params: { query: request },
        },
      );
      if (error || !data) {
        throw errorFormatter('Error fetching earning history', error);
      }
      return data as unknown as Record<string, unknown>;
    },
  };
}
