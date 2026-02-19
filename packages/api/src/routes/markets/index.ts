import { errorFormatter } from '../../utils/errorFormatter.js';

import type { QueryClient } from '../../client/index.js';
import type { Market, MarketRequiredResources, NosanaMarketsApi } from './types.js';

export * from './types.js';

export function createNosanaMarketsApi(client: QueryClient): NosanaMarketsApi {
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

