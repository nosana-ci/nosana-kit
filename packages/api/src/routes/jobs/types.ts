import type { operations } from '../../client/blockchain-indexer/schema.js';
import type { operations as clientManagerOperations } from '../../client/client-manager/schema.js';

// Job type from the batch endpoint (which has proper typed responses)
export type Job =
  operations['postJobsBatch']['responses'][200]['content']['application/json'][number];

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
export type JobCountRequest = NonNullable<operations['getJobsCount']['parameters']['query']>;
export type JobCountResponse = operations['getJobsCount']['responses'][200]['content']['application/json'];
export type JobBatchRequest = operations['postJobsBatch']['requestBody']['content']['application/json'];

// Credit-based job operations (client-manager)
export type NosanaApiExtendJobRequest =
  clientManagerOperations['postJobsByAddressExtend']['requestBody']['content']['application/json'] &
  clientManagerOperations['postJobsByAddressExtend']['parameters']['path'];
export type NosanaApiExtendJobResponse =
  clientManagerOperations['postJobsByAddressExtend']['responses'][200]['content']['application/json'];
export type StopJobWithCreditsResponse =
  clientManagerOperations['postJobsByAddressStop']['responses'][200]['content']['application/json'];

// Backward-compatible aliases used by @nosana/kit
export type NosanaApiStopJobRequest = string;
export type NosanaApiStopJobResponse = StopJobWithCreditsResponse;

export interface NosanaJobsApi {
  get: (
    request: NosanaApiGetJobByAddressRequest,
  ) => Promise<NosanaApiGetJobByAddressResponse>;
  getAll: (
    request?: NosanaApiGetAllJobsRequest,
  ) => Promise<NosanaApiGetAllJobsResponse>;
  list: (
    request: NosanaApiListJobRequest,
  ) => Promise<NosanaApiListJobResponse>;
  extend: (
    request: NosanaApiExtendJobRequest,
  ) => Promise<NosanaApiExtendJobResponse>;
  stop: (address: string) => Promise<StopJobWithCreditsResponse>;
  getRunning: () => Promise<Record<string, unknown>>;
  getRunningNodes: (request: JobRunningNodesRequest) => Promise<Record<string, unknown>>;
  getLongRunning: (request?: JobLongRunningRequest) => Promise<Record<string, unknown>>;
  getStats: (request?: JobStatsRequest) => Promise<Record<string, unknown>>;
  getStatsTimestamps: (request?: JobStatsTimestampsRequest) => Promise<Record<string, unknown>>;
  getCount: (request?: JobCountRequest) => Promise<JobCountResponse>;
  getBatch: (request: JobBatchRequest) => Promise<Job[]>;
}
