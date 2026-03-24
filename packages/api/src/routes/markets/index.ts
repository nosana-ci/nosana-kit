import { errorFormatter } from '../../utils/errorFormatter.js';

import type { HostManagerClient } from '../../client/host-manager/index.js';
import type {
  Market,
  MarketRequiredResources,
  MarketPriceResponse,
  NosanaMarketsApi,
} from './types.js';

export * from './types.js';

export function createNosanaMarketsApi(clients: {
  hostManager: HostManagerClient;
}): NosanaMarketsApi {
  const { hostManager: client } = clients;
  return {
    async list(): Promise<Market[]> {
      const { data, error } = await client.GET('/markets/', {
        params: { query: {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to fetch markets', error);
      }

      return data as unknown as Market[];
    },
    async get(market: string): Promise<Market> {
      const { data, error } = await client.GET('/markets/{id}', {
        params: {
          path: { id: market },
          query: {},
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to fetch market', error);
      }

      return data as unknown as Market;
    },
    async getRequiredResources(
      market: string,
    ): Promise<MarketRequiredResources> {
      const { data, error } = await client.GET(
        '/markets/{id}/required-resources',
        {
          params: {
            path: { id: market },
          },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to fetch required resources', error);
      }

      return data as unknown as MarketRequiredResources;
    },
    async getPrices(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/markets/prices', {});

      if (error || !data) {
        throw errorFormatter('Failed to fetch market prices', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getPrice(): Promise<MarketPriceResponse> {
      const { data, error } = await client.GET('/markets/price', {});

      if (error || !data) {
        throw errorFormatter('Failed to fetch NOS price', error);
      }

      return data;
    },
    async getGpuTypes(): Promise<Record<string, unknown>[]> {
      const { data, error } = await client.GET('/markets/gpu-types', {});

      if (error || !data) {
        throw errorFormatter('Failed to fetch GPU types', error);
      }

      return data as unknown as Record<string, unknown>[];
    },
    async getDockerImages(): Promise<Record<string, unknown>[]> {
      const { data, error } = await client.GET('/markets/docker-images', {});

      if (error || !data) {
        throw errorFormatter('Failed to fetch Docker images', error);
      }

      return data as unknown as Record<string, unknown>[];
    },
  };
}
