import { errorFormatter } from '../../utils/errorFormatter.js';

import type { BlockchainIndexerClient } from '../../client/blockchain-indexer/index.js';
import type { ClientManagerClient } from '../../client/client-manager/index.js';
import type {
  NosanaJobsApi,
  NosanaJobActionOptions,
  NosanaJobBatchOptions,
  NosanaApiExtendJobRequest,
  NosanaApiExtendJobResponse,
  NosanaApiStopJobRequest,
  NosanaApiStopJobResponse,
  NosanaApiGetJobByAddressRequest,
  NosanaApiGetJobByAddressResponse,
  NosanaApiGetAllJobsRequest,
  NosanaApiGetAllJobsResponse,
  NosanaApiListJobRequest,
  NosanaApiListJobResponse,
  NosanaApiListJobBatchRequest,
  NosanaApiExtendJobBatchRequest,
  NosanaApiStopJobBatchRequest,
  NosanaApiJobsBatchResponse,
  Job,
  JobRunningNodesRequest,
  JobLongRunningRequest,
  JobStatsRequest,
  JobStatsTimestampsRequest,
  JobStatsTimestampsHoursRequest,
  JobCountRequest,
  JobCountResponse,
  JobBatchRequest,
} from './types.js';

export * from './types.js';

/**
 * Builds the optional request init that carries the `Idempotency-Key` header.
 * Returns an empty object when no key is supplied so the request is unchanged.
 */
function idempotencyInit({ idempotencyKey }: NosanaJobActionOptions = {}) {
  return idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {};
}

export function createNosanaJobsApi(clients: {
  blockchainIndexer: BlockchainIndexerClient;
  clientManager: ClientManagerClient;
}): NosanaJobsApi {
  const { blockchainIndexer, clientManager } = clients;
  return {
    async get(
      address: NosanaApiGetJobByAddressRequest,
    ): Promise<NosanaApiGetJobByAddressResponse> {
      const { data, error, response } = await blockchainIndexer.GET('/jobs/{address}', {
        params: {
          path: {
            address,
          },
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get job', error, response);
      }

      return data as unknown as NosanaApiGetJobByAddressResponse;
    },
    async getAll(
      request?: NosanaApiGetAllJobsRequest,
    ): Promise<NosanaApiGetAllJobsResponse> {
      const { data, error, response } = await blockchainIndexer.GET('/jobs/', {
        params: {
          query: request ?? {},
        },
      });

      if (error || !data) {
        throw errorFormatter('Failed to get all jobs', error, response);
      }

      return data as unknown as NosanaApiGetAllJobsResponse;
    },
    async list(
      request: NosanaApiListJobRequest,
      options?: NosanaJobActionOptions,
    ): Promise<NosanaApiListJobResponse> {
      const { data, error, response } = await clientManager.POST('/jobs/list', {
        body: request,
        ...idempotencyInit(options),
      });

      if (error || !data) {
        throw errorFormatter('Failed to list job', error, response);
      }

      return data;
    },
    async extend(
      { address, ...request }: NosanaApiExtendJobRequest,
      options?: NosanaJobActionOptions,
    ): Promise<NosanaApiExtendJobResponse> {
      const { data, error, response } = await clientManager.POST(
        '/jobs/{address}/extend',
        {
          params: {
            path: { address },
          },
          body: request,
          ...idempotencyInit(options),
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to extend job', error, response);
      }

      return data;
    },
    async stop(
      address: NosanaApiStopJobRequest,
      options?: NosanaJobActionOptions,
    ): Promise<NosanaApiStopJobResponse> {
      const { data, error, response } = await clientManager.POST('/jobs/{address}/stop', {
        params: {
          path: { address },
        },
        ...idempotencyInit(options),
      });

      if (error || !data) {
        throw errorFormatter('Failed to stop job', error, response);
      }

      return data;
    },
    async listBatch(request: NosanaApiListJobBatchRequest, options: NosanaJobBatchOptions): Promise<NosanaApiJobsBatchResponse> {
      const { data, error, response } = await clientManager.POST('/jobs/list/batch', {
        params: { header: { 'Idempotency-Key': options.idempotencyKey } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to list job batch', error, response);
      }

      return data;
    },
    async extendBatch(request: NosanaApiExtendJobBatchRequest, options: NosanaJobBatchOptions): Promise<NosanaApiJobsBatchResponse> {
      const { data, error, response } = await clientManager.POST('/jobs/extend/batch', {
        params: { header: { 'Idempotency-Key': options.idempotencyKey } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to extend job batch', error, response);
      }

      return data;
    },
    async stopBatch(request: NosanaApiStopJobBatchRequest, options: NosanaJobBatchOptions): Promise<NosanaApiJobsBatchResponse> {
      const { data, error, response } = await clientManager.POST('/jobs/stop/batch', {
        params: { header: { 'Idempotency-Key': options.idempotencyKey } },
        body: request,
      });

      if (error || !data) {
        throw errorFormatter('Failed to stop job batch', error, response);
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
    async getStatsTimestampsHours(
      request?: JobStatsTimestampsHoursRequest,
    ): Promise<Record<string, unknown>> {
      const { data, error } = await blockchainIndexer.GET(
        '/jobs/stats/timestamps-hours',
        {
          params: { query: request ?? {} },
        },
      );

      if (error || !data) {
        throw errorFormatter('Failed to get GPU compute hours', error);
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

      return data;
    },
  };
}
