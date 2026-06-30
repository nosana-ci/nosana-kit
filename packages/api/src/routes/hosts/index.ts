import { errorFormatter } from '../../utils/errorFormatter.js';

import type { HostManagerClient } from '../../client/host-manager/index.js';
import type {
  NosanaHostsApi,
  NodeListRequest,
  NodeQueuedRequest,
  NodeUptimeRequest,
  NodeWithAccessRequest,
  NodeRequestMarketRequest,
  NodeMarketRelationRequest,
  NodeMinimumVersionRequest,
  NodeMetricsQuery,
  NodeRegisterRequest,
  NodeSyncRequest,
  NodeMetricsBody,
  NodeAddressRequest,
  NodeContactRequest,
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
    async getAvailableGpus(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/available-gpus', {});

      if (error || !data) {
        throw errorFormatter('Failed to get available GPUs', error);
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
    async getWithAccess(
      request?: NodeWithAccessRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/with-access', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get nodes with access', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getRewards(): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/rewards', {});

      if (error || !data) {
        throw errorFormatter('Failed to get node rewards', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getRequestMarket(
      request?: NodeRequestMarketRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/request-market', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to request market', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMarketRelation(
      request?: NodeMarketRelationRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/market-relation', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get market relation', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMinimumRequiredVersion(
      request?: NodeMinimumVersionRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET(
        '/nodes/minimum-required-version',
        {
          params: { query: request ?? {} },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get minimum required version', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getFull(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}/full', {
        params: { path: { id } },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get full node', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getInfo(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}/info', {
        params: { path: { id } },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get node info', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getMetrics(
      id: string,
      request?: NodeMetricsQuery,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}/metrics', {
        params: { path: { id }, query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get node metrics', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getRewardsById(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}/rewards', {
        params: { path: { id } },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get node rewards', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getRecentBenchmarks(id: string): Promise<Record<string, unknown>> {
      const { data, error } = await client.GET('/nodes/{id}/recent-benchmarks', {
        params: { path: { id } },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get recent benchmarks', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async register(
      request: NodeRegisterRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/nodes/register', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to register node', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async syncNode(request: NodeSyncRequest): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/nodes/sync-node', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to sync node', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async heartbeat(): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/nodes/heartbeat', {});

      if (error || !data) {
        throw errorFormatter('Failed to send heartbeat', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async payment(): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/nodes/payment', {});

      if (error || !data) {
        throw errorFormatter('Failed to process node payment', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async postMetrics(
      id: string,
      request: NodeMetricsBody,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.POST('/nodes/{id}/metrics', {
        params: { path: { id } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to post node metrics', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async updateAddress(
      id: string,
      request: NodeAddressRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.PATCH('/nodes/{id}/address', {
        params: { path: { id } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to update node address', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async updateContact(
      id: string,
      request: NodeContactRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await client.PATCH('/nodes/{id}/contact', {
        params: { path: { id } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to update node contact', error);
      }

      return data as unknown as Record<string, unknown>;
    },
  };
}
