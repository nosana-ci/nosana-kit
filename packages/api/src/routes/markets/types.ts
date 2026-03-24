import type { operations } from '../../client/host-manager/schema.js';

// Market types — host-manager Elysia swagger doesn't provide response schemas,
// so these are defined manually to match the actual API responses.
export type Market = Record<string, unknown>;
export type MarketRequiredResources = Record<string, unknown>;

// getMarketsPrice is one of the few host-manager endpoints with a typed response
export type MarketPriceResponse =
  operations['getMarketsPrice']['responses']['200']['content']['application/json'];

export interface NosanaMarketsApi {
  list: () => Promise<Market[]>;
  get: (market: string) => Promise<Market>;
  getRequiredResources: (market: string) => Promise<MarketRequiredResources>;
  getPrices: () => Promise<Record<string, unknown>>;
  getPrice: () => Promise<MarketPriceResponse>;
  getGpuTypes: () => Promise<Record<string, unknown>[]>;
  getDockerImages: () => Promise<Record<string, unknown>[]>;
}
