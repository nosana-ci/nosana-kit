import type { operations } from '../../client/blockchain-indexer/schema.js';

export type StatsPriceRequest =
  operations['getStatsPrice']['parameters']['query'];

export type StatsPriceResponse =
  operations['getStatsPrice']['responses']['200']['content']['application/json'];

export type StatsHistoryRequest =
  operations['getStatsSpending-history']['parameters']['query'];

export interface NosanaStatsApi {
  get: () => Promise<Record<string, unknown>>;
  getPrice: (request?: StatsPriceRequest) => Promise<StatsPriceResponse>;
  getSpendingHistory: (
    request: StatsHistoryRequest,
  ) => Promise<Record<string, unknown>>;
  getEarningHistory: (
    request: StatsHistoryRequest,
  ) => Promise<Record<string, unknown>>;
}
