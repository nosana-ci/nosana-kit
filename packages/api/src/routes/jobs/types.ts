import type { operations } from '../../client/blockchain-indexer/schema.js';
import type { components } from '../../client/client-manager/schema.js';

// Job type from the batch endpoint (which has proper typed responses)
export type Job =
  operations['postJobsBatch']['responses'][200]['content']['application/json'][number];

// Request types from OpenAPI
export type NosanaApiGetJobByAddressRequest =
  operations['getJobsByAddress']['parameters']['path']['address'];
export type NosanaApiListJobRequest =
  operations['getJobs']['parameters']['query'];

// Response types
export type NosanaApiGetJobByAddressResponse = Job;
export type NosanaApiListJobResponse = Job[];

// Query types for new routes
export type JobRunningNodesRequest = operations['getJobsRunning-nodes']['parameters']['query'];
export type JobLongRunningRequest = NonNullable<operations['getJobsLong-running']['parameters']['query']>;
export type JobStatsRequest = NonNullable<operations['getJobsStats']['parameters']['query']>;
export type JobStatsTimestampsRequest = NonNullable<operations['getJobsStatsTimestamps']['parameters']['query']>;
export type JobCountRequest = NonNullable<operations['getJobsCount']['parameters']['query']>;
export type JobCountResponse = operations['getJobsCount']['responses'][200]['content']['application/json'];
export type JobBatchRequest = operations['postJobsBatch']['requestBody']['content']['application/json'];

// Credit-based job operations (client-manager)
export type CreateJobWithCreditsRequest = {
  ipfsHash: string;
  market: string;
  timeout?: number;
  node?: string;
};
export type CreateJobWithCreditsResponse =
  components['schemas']['CreateJobWithCreditsResponse'];
export type ExtendJobWithCreditsRequest = { seconds: number };
export type ExtendJobWithCreditsResponse =
  components['schemas']['ExtendJobWithCreditsResponse'];
export type StopJobWithCreditsResponse =
  components['schemas']['StopJobWithCreditsResponse'];

export interface NosanaJobsApi {
  get: (
    request: NosanaApiGetJobByAddressRequest,
  ) => Promise<NosanaApiGetJobByAddressResponse>;
  list: (
    request?: NosanaApiListJobRequest,
  ) => Promise<NosanaApiListJobResponse>;
  create: (
    request: CreateJobWithCreditsRequest,
  ) => Promise<CreateJobWithCreditsResponse>;
  extend: (
    address: string,
    request: ExtendJobWithCreditsRequest,
  ) => Promise<ExtendJobWithCreditsResponse>;
  stop: (address: string) => Promise<StopJobWithCreditsResponse>;
  getRunning: () => Promise<Record<string, unknown>>;
  getRunningNodes: (request: JobRunningNodesRequest) => Promise<Record<string, unknown>>;
  getLongRunning: (request?: JobLongRunningRequest) => Promise<Record<string, unknown>>;
  getStats: (request?: JobStatsRequest) => Promise<Record<string, unknown>>;
  getStatsTimestamps: (request?: JobStatsTimestampsRequest) => Promise<Record<string, unknown>>;
  getCount: (request?: JobCountRequest) => Promise<JobCountResponse>;
  getBatch: (request: JobBatchRequest) => Promise<Job[]>;
}
