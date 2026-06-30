import { errorFormatter } from '../../utils/errorFormatter.js';

import type { HostManagerClient } from '../../client/host-manager/index.js';
import type {
  NosanaBenchmarksApi,
  MarketMetricAggregatesRequest,
  BenchmarkThresholdsRequest,
  BenchmarkMetricsRequest,
  MarketThresholdsRequest,
  BenchmarkPredictionRequest,
  BenchmarkSubmitResultsRequest,
  BenchmarkSeedRequest,
} from './types.js';

export * from './types.js';

export function createNosanaBenchmarksApi(clients: {
  hostManager: HostManagerClient;
}): NosanaBenchmarksApi {
  const { hostManager: client } = clients;
  return {
    async getRecent(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/benchmarks/recent', {});

      if (error || !data) {
        throw errorFormatter('Failed to get recent benchmarks', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMarketMetricAggregates(
      request?: MarketMetricAggregatesRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmarks/market-metric-aggregates',
        {
          params: { query: request ?? {} },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get market metric aggregates', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getVersion(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmarks/benchmark-version',
        {},
      );

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark version', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getThresholds(
      request?: BenchmarkThresholdsRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/benchmarks/thresholds', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark thresholds', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMetrics(
      request?: BenchmarkMetricsRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/benchmarks/metrics', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark metrics', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getOperations(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/benchmarks/operations', {});

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark operations', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMetricProcessors(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmarks/metric-processors',
        {},
      );

      if (error || !data) {
        throw errorFormatter('Failed to get metric processors', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMarketThresholds(
      request?: MarketThresholdsRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmarks/market-thresholds',
        {
          params: { query: request ?? {} },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get market thresholds', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getTemplatesConfig(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/benchmark-templates/config', {});

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark templates config', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getTemplatesRefresh(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmark-templates/refresh',
        {},
      );

      if (error || !data) {
        throw errorFormatter('Failed to refresh benchmark templates', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getPrediction(
      id: string,
      request: BenchmarkPredictionRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/benchmarks/{id}/prediction', {
        params: { path: { id } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark prediction', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async submitResults(
      id: string,
      request: BenchmarkSubmitResultsRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST(
        '/benchmarks/{id}/submit-results',
        {
          params: { path: { id } },
          body: request,
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to submit benchmark results', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async seed(
      id: string,
      request: BenchmarkSeedRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/benchmarks/{id}/seed', {
        params: { path: { id } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to seed benchmark', error);
      }

      return data as unknown as Record<string, unknown>;
    },
  };
}
