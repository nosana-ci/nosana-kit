import { operations } from "../../client/blockchain-indexer/schema.js";

export type Market = operations['getApiMarkets']['responses'][200]['content']['application/json'][number];
export type MarketRequiredResources = operations['getApiMarketsByIdRequired-resources']['responses'][200]['content']['application/json'];

export interface NosanaMarketsApi {
  list: () => Promise<Market[]>;
  get: (market: string) => Promise<Market>;
  getRequiredResources: (market: string) => Promise<MarketRequiredResources>;
}

