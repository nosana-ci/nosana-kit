import { errorFormatter } from '../../utils/errorFormatter.js';

import type { HostManagerClient } from '../../client/host-manager/index.js';
import type {
  NosanaHostsApi,
  NodeListRequest,
  NodeQueuedRequest,
  NodeUptimeRequest,
  HostsFilterRequest,
  HostsFiltersOptionsRequest,
  BenchmarkReportRequest,
  BenchmarkSummaryRequest,
} from './types.js';

export * from './types.js';

export function createNosanaHostsApi(clients: {
  hostManager: HostManagerClient;
}): NosanaHostsApi {
  const { hostManager: client } = clients;
  return {
    async list(request?: NodeListRequest): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to list nodes', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async get(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}', {
        params: {
          path: { id },
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get node', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getSpecs(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}/specs', {
        params: {
          path: { id },
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get node specs', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getAvailableGpus(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/available-gpus', {});

      if (error || !data) {
        throw errorFormatter('Failed to get available GPUs', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getStats(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/stats', {});

      if (error || !data) {
        throw errorFormatter('Failed to get node stats', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getQueuedNodes(
      request?: NodeQueuedRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/queued-nodes', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get queued nodes', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getUptime(
      node: string,
      request?: NodeUptimeRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/nodes/heartbeats/uptime/{node}',
        {
          params: {
            path: { node },
            query: request ?? {},
          },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get node uptime', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getByCountry(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/stats/nodes-country', {});

      if (error || !data) {
        throw errorFormatter('Failed to get nodes by country', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getAvailableHosts(
      request?: HostsFilterRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/hosts/', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get available hosts', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getFilters(
      request?: HostsFiltersOptionsRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/hosts/filters', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get host filters', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getBenchmarkReport(
      request?: BenchmarkReportRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/benchmarks/node-report', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark report', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getTemplatePerformance(
      nodeId: string,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmarks/node-template-performance/{nodeId}',
        {
          params: {
            path: { nodeId },
          },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get template performance', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getBenchmarkSummary(
      request?: BenchmarkSummaryRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/benchmarks/markets/benchmark-summary',
        {
          params: { query: request ?? {} },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get benchmark summary', error);
      }

      return data as unknown as Record<string, unknown>;
    },
  };
}
