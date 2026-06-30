import type { operations } from '../../client/host-manager/schema.js';

export type MarketMetricAggregatesRequest = NonNullable<
  operations['getBenchmarksMarket-metric-aggregates']['parameters']['query']
>;
export type BenchmarkThresholdsRequest = NonNullable<
  operations['getBenchmarksThresholds']['parameters']['query']
>;
export type BenchmarkMetricsRequest = NonNullable<
  operations['getBenchmarksMetrics']['parameters']['query']
>;
export type MarketThresholdsRequest = NonNullable<
  operations['getBenchmarksMarket-thresholds']['parameters']['query']
>;
export type BenchmarkPredictionRequest = NonNullable<
  operations['postBenchmarksByIdPrediction']['requestBody']
>['content']['application/json'];
export type BenchmarkSubmitResultsRequest = NonNullable<
  operations['postBenchmarksByIdSubmit-results']['requestBody']
>['content']['application/json'];
export type BenchmarkSeedRequest = NonNullable<
  operations['postBenchmarksByIdSeed']['requestBody']
>['content']['application/json'];

export interface NosanaBenchmarksApi {
  getRecent: () => Promise<Record<string, unknown>>;
  getMarketMetricAggregates: (
    request?: MarketMetricAggregatesRequest,
  ) => Promise<Record<string, unknown>>;
  getVersion: () => Promise<Record<string, unknown>>;
  getThresholds: (
    request?: BenchmarkThresholdsRequest,
  ) => Promise<Record<string, unknown>>;
  getMetrics: (
    request?: BenchmarkMetricsRequest,
  ) => Promise<Record<string, unknown>>;
  getOperations: () => Promise<Record<string, unknown>>;
  getMetricProcessors: () => Promise<Record<string, unknown>>;
  getMarketThresholds: (
    request?: MarketThresholdsRequest,
  ) => Promise<Record<string, unknown>>;
  getTemplatesConfig: () => Promise<Record<string, unknown>>;
  getTemplatesRefresh: () => Promise<Record<string, unknown>>;
  getPrediction: (
    id: string,
    request: BenchmarkPredictionRequest,
  ) => Promise<Record<string, unknown>>;
  submitResults: (
    id: string,
    request: BenchmarkSubmitResultsRequest,
  ) => Promise<Record<string, unknown>>;
  seed: (
    id: string,
    request: BenchmarkSeedRequest,
  ) => Promise<Record<string, unknown>>;
}
