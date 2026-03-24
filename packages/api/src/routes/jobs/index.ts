import { errorFormatter } from '../../utils/errorFormatter.js';

import type { BlockchainIndexerClient } from '../../client/blockchain-indexer/index.js';
import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type {
  NosanaJobsApi,
  NosanaApiGetJobByAddressRequest,
  NosanaApiGetJobByAddressResponse,
  NosanaApiListJobRequest,
  NosanaApiListJobResponse,
  CreateJobWithCreditsRequest,
  CreateJobWithCreditsResponse,
  ExtendJobWithCreditsRequest,
  ExtendJobWithCreditsResponse,
  StopJobWithCreditsResponse,
  Job,
  JobRunningNodesRequest,
  JobLongRunningRequest,
  JobStatsRequest,
  JobStatsTimestampsRequest,
  JobCountRequest,
  JobCountResponse,
  JobBatchRequest,
} from './types.js';

export * from './types.js';

export function createNosanaJobsApi(clients: {
  blockchainIndexer: BlockchainIndexerClient;
  clientManager: ClientManagerClient;
}): NosanaJobsApi {
  const { blockchainIndexer, clientManager } = clients;
  return {
    async get(
      address: NosanaApiGetJobByAddressRequest,
    ): Promise<NosanaApiGetJobByAddressResponse> {
      const { data, error } = await blockchainIndexer.GET('/jobs/{address}', {
        params: {
          path: {
            address,
          },
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job', error);
      }

      return data as unknown as NosanaApiGetJobByAddressResponse;
    },
    async list(
      request?: NosanaApiListJobRequest,
    ): Promise<NosanaApiListJobResponse> {
      const { data, error } = await blockchainIndexer.GET('/jobs/', {
        params: {
          query: request ?? {},
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to list jobs', error);
      }

      return data as unknown as NosanaApiListJobResponse;
    },
    async create(
      request: CreateJobWithCreditsRequest,
    ): Promise<CreateJobWithCreditsResponse> {
      const { data, error } = await clientManager.POST('/jobs/list', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to create job', error);
      }

      return data;
    },
    async extend(
      address: string,
      request: ExtendJobWithCreditsRequest,
    ): Promise<ExtendJobWithCreditsResponse> {
      const { data, error } = await clientManager.POST(
        '/jobs/{address}/extend',
        {
          params: {
            path: { address },
          },
          body: request,
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to extend job', error);
      }

      return data;
    },
    async stop(address: string): Promise<StopJobWithCreditsResponse> {
      const { data, error } = await clientManager.POST('/jobs/{address}/stop', {
        params: {
          path: { address },
        },
        body: undefined,
      });

      if (error || !data) {
        throw errorFormatter('Failed to stop job', error);
      }

      return data;
    },
    async getRunning(): Promise<Record<string, unknown>> {
      const { data, error } = await blockchainIndexer.GET('/jobs/running', {});

      if (error || !data) {
        throw errorFormatter('Failed to get running jobs', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getRunningNodes(request: JobRunningNodesRequest): Promise<Record<string, unknown>> {
      const { data, error } = await blockchainIndexer.GET('/jobs/running-nodes', {
        params: { query: request },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get running nodes', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getLongRunning(request?: JobLongRunningRequest): Promise<Record<string, unknown>> {
      const { data, error } = await blockchainIndexer.GET('/jobs/long-running', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get long-running jobs', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getStats(request?: JobStatsRequest): Promise<Record<string, unknown>> {
      const { data, error } = await blockchainIndexer.GET('/jobs/stats', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job stats', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getStatsTimestamps(request?: JobStatsTimestampsRequest): Promise<Record<string, unknown>> {
      const { data, error } = await blockchainIndexer.GET('/jobs/stats/timestamps', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job stats timestamps', error);
      }

      return data as unknown as Record<string, unknown>;
    },
    async getCount(request?: JobCountRequest): Promise<JobCountResponse> {
      const { data, error } = await blockchainIndexer.GET('/jobs/count', {
        params: { query: request ?? {} },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job count', error);
      }

      return data;
    },
    async getBatch(request: JobBatchRequest): Promise<Job[]> {
      const { data, error } = await blockchainIndexer.POST('/jobs/batch', {
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to get jobs batch', error);
      }

      return data as unknown as Job[];
    },
  };
}
