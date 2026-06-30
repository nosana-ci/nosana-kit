import type { operations } from '../../client/blockchain-indexer/schema.js';
import type { operations as clientManagerOperations } from '../../client/client-manager/schema.js';

// Job type from the batch endpoint (which has proper typed responses)
export type Job =
  operations['postJobsBatch']['responses'][200]['content']['application/json'][number];

// Batch jobs wire types, sourced from the client-manager OpenAPI schema.
export type NosanaApiListJobBatchRequest =
  clientManagerOperations['postJobsListBatch']['requestBody']['content']['application/json'];
export type NosanaApiExtendJobBatchRequest =
  clientManagerOperations['postJobsExtendBatch']['requestBody']['content']['application/json'];
export type NosanaApiStopJobBatchRequest =
  clientManagerOperations['postJobsStopBatch']['requestBody']['content']['application/json'];
export type NosanaApiJobsBatchResponse =
  clientManagerOperations['postJobsListBatch']['responses'][200]['content']['application/json'];
export type NosanaApiJobsBatchItem = NosanaApiJobsBatchResponse['items'][number];

// Request types from OpenAPI
export type NosanaApiGetJobByAddressRequest =
  operations['getJobsByAddress']['parameters']['path']['address'];
export type NosanaApiGetAllJobsRequest =
  operations['getJobs']['parameters']['query'];

// Response types
export type NosanaApiGetJobByAddressResponse = Job;
export type NosanaApiGetAllJobsResponse = Job[];

// Credit-based job listing (POST /jobs/list on client-manager)
export type NosanaApiListJobRequest = {
  ipfsHash: string;
  market: string;
  timeout?: number;
  node?: string;
};
export type NosanaApiListJobResponse =
  clientManagerOperations['postJobsList']['responses'][200]['content']['application/json'];

// Query types for new routes
export type JobRunningNodesRequest = operations['getJobsRunning-nodes']['parameters']['query'];
export type JobLongRunningRequest = NonNullable<operations['getJobsLong-running']['parameters']['query']>;
export type JobStatsRequest = NonNullable<operations['getJobsStats']['parameters']['query']>;
export type JobStatsTimestampsRequest = NonNullable<operations['getJobsStatsTimestamps']['parameters']['query']>;
export type JobStatsTimestampsHoursRequest = NonNullable<operations['getJobsStatsTimestamps-hours']['parameters']['query']>;
export type JobCountRequest = NonNullable<operations['getJobsCount']['parameters']['query']>;
export type JobCountResponse = operations['getJobsCount']['responses'][200]['content']['application/json'];
export type JobBatchRequest = operations['postJobsBatch']['requestBody']['content']['application/json'];

// Credit-based job operations (client-manager)
export type NosanaApiExtendJobRequest =
  clientManagerOperations['postJobsByAddressExtend']['requestBody']['content']['application/json'] &
  clientManagerOperations['postJobsByAddressExtend']['parameters']['path'];

// `stop` is addressed by job address; alias kept for @nosana/kit consumers.
export type NosanaApiStopJobRequest = string;

// Extend/Stop responses, sourced from the client-manager OpenAPI schema. Both
// model the already-terminal no-op: `tx` is `null` and (for extend) `credits`
// is omitted; stop carries an `outcome` discriminator.
export type NosanaApiExtendJobResponse =
  clientManagerOperations['postJobsByAddressExtend']['responses'][200]['content']['application/json'];
export type NosanaApiStopJobResponse =
  clientManagerOperations['postJobsByAddressStop']['responses'][200]['content']['application/json'];

export interface NosanaJobActionOptions {
  /**
   * Optional idempotency key. When provided it is sent as the `Idempotency-Key`
   * request header so the API can safely de-duplicate retried requests. The
   * header is fully optional and omitting it leaves behaviour unchanged.
   */
  idempotencyKey?: string;
}

export interface NosanaJobBatchOptions {
  /**
   * Idempotency key for the batch (one key per batch). **Required** — the batch
   * endpoints reject the request with `400` if it is omitted. Reuse the same key
   * when retrying the batch; already-landed items stay landed.
   */
  idempotencyKey: string;
}

export interface NosanaJobsApi {
  get: (
    request: NosanaApiGetJobByAddressRequest,
  ) => Promise<NosanaApiGetJobByAddressResponse>;
  getAll: (
    request?: NosanaApiGetAllJobsRequest,
  ) => Promise<NosanaApiGetAllJobsResponse>;
  list: (
    request: NosanaApiListJobRequest,
    options?: NosanaJobActionOptions,
  ) => Promise<NosanaApiListJobResponse>;
  extend: (
    request: NosanaApiExtendJobRequest,
    options?: NosanaJobActionOptions,
  ) => Promise<NosanaApiExtendJobResponse>;
  stop: (
    request: NosanaApiStopJobRequest,
    options?: NosanaJobActionOptions,
  ) => Promise<NosanaApiStopJobResponse>;
  listBatch: (request: NosanaApiListJobBatchRequest, options: NosanaJobBatchOptions) => Promise<NosanaApiJobsBatchResponse>;
  extendBatch: (request: NosanaApiExtendJobBatchRequest, options: NosanaJobBatchOptions) => Promise<NosanaApiJobsBatchResponse>;
  stopBatch: (request: NosanaApiStopJobBatchRequest, options: NosanaJobBatchOptions) => Promise<NosanaApiJobsBatchResponse>;
  getRunning: () => Promise<Record<string, unknown>>;
  getRunningNodes: (request: JobRunningNodesRequest) => Promise<Record<string, unknown>>;
  getLongRunning: (request?: JobLongRunningRequest) => Promise<Record<string, unknown>>;
  getStats: (request?: JobStatsRequest) => Promise<Record<string, unknown>>;
  getStatsTimestamps: (request?: JobStatsTimestampsRequest) => Promise<Record<string, unknown>>;
  getStatsTimestampsHours: (request?: JobStatsTimestampsHoursRequest) => Promise<Record<string, unknown>>;
  getCount: (request?: JobCountRequest) => Promise<JobCountResponse>;
  getBatch: (request: JobBatchRequest) => Promise<Job[]>;
}
