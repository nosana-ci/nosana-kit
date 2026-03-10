import { operations } from "../../client/blockchain-indexer/schema.js";

// Request types from OpenAPI
export type NosanaApiGetJobByAddressRequest = operations['getApiJobsByAddress']['parameters']['path']['address'];
export type NosanaApiListJobRequest = operations['postApiJobsList']['requestBody']['content']['application/json'];
export type NosanaApiExtendJobRequest =
  operations['postApiJobsByAddressExtend']['requestBody']['content']['application/json'] &
  operations['postApiJobsByAddressExtend']['parameters']['path'];
export type NosanaApiStopJobRequest = operations['postApiJobsByAddressStop']['parameters']['path']['address'];

// Response types from OpenAPI
export type NosanaApiListJobResponse = operations['postApiJobsList']['responses'][200]['content']['application/json'];
export type NosanaApiExtendJobResponse = operations['postApiJobsByAddressExtend']['responses'][200]['content']['application/json'];
export type NosanaApiStopJobResponse = operations['postApiJobsByAddressStop']['responses'][200]['content']['application/json'];
export type NosanaApiGetJobByAddressResponse = operations['getApiJobsByAddress']['responses'][200]['content']['application/json'];

export interface NosanaJobsApi {
  get: (request: NosanaApiGetJobByAddressRequest) => Promise<NosanaApiGetJobByAddressResponse>;
  list: (request: NosanaApiListJobRequest) => Promise<NosanaApiListJobResponse>;
  extend: (request: NosanaApiExtendJobRequest) => Promise<NosanaApiExtendJobResponse>;
  stop: (request: NosanaApiStopJobRequest) => Promise<NosanaApiStopJobResponse>;
}