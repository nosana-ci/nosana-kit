import { operations } from "../../client/schema.js";

import type {
  NosanaApiListJobBatchRequest,
  NosanaApiExtendJobBatchRequest,
  NosanaApiStopJobBatchRequest,
  NosanaApiJobsBatchResponse,
  NosanaApiJobsBatchItem,
} from '../../client/jobsBatch.js';

// Re-export the batch wire types as part of the public API surface.
export type {
  NosanaApiListJobBatchRequest,
  NosanaApiExtendJobBatchRequest,
  NosanaApiStopJobBatchRequest,
  NosanaApiJobsBatchResponse,
  NosanaApiJobsBatchItem,
};

// Request types from OpenAPI
export type NosanaApiGetJobByAddressRequest = operations['getApiJobsByAddress']['parameters']['path']['address'];
export type NosanaApiListJobRequest = operations['postApiJobsList']['requestBody']['content']['application/json'];
export type NosanaApiExtendJobRequest =
  operations['postApiJobsByAddressExtend']['requestBody']['content']['application/json'] &
  operations['postApiJobsByAddressExtend']['parameters']['path'];
export type NosanaApiStopJobRequest = operations['postApiJobsByAddressStop']['parameters']['path']['address'];

// Response types from OpenAPI
export type NosanaApiListJobResponse = operations['postApiJobsList']['responses'][200]['content']['application/json'];
export type NosanaApiGetJobByAddressResponse = operations['getApiJobsByAddress']['responses'][200]['content']['application/json'];

// Extend/Stop responses are hand-defined to match the client-manager contract
// (lockstep-checked in clientManagerSchema.lockstep.ts). The dashboard's
// generated schema lags these shapes, and sourcing them from the CM schema
// directly would pull that large generated module into the public type graph.

/**
 * Response from extending a single job. `tx` is `null` and `credits` is omitted
 * when the job was already terminal — a confirmed no-op, nothing was charged.
 */
export interface NosanaApiExtendJobResponse {
  tx: string | null;
  job: string;
  credits?: {
    costUSD: number;
    creditsUsed: number;
    reservationId: string;
  };
}

/**
 * Response from stopping a single job. `tx` is `null` with
 * `outcome: "already_terminal"` when the job was already terminal.
 */
export interface NosanaApiStopJobResponse {
  tx: string | null;
  job: string;
  delisted: boolean;
  outcome?: 'delisted' | 'ended' | 'already_terminal';
}

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
  get: (request: NosanaApiGetJobByAddressRequest) => Promise<NosanaApiGetJobByAddressResponse>;
  list: (request: NosanaApiListJobRequest, options?: NosanaJobActionOptions) => Promise<NosanaApiListJobResponse>;
  extend: (request: NosanaApiExtendJobRequest, options?: NosanaJobActionOptions) => Promise<NosanaApiExtendJobResponse>;
  stop: (request: NosanaApiStopJobRequest, options?: NosanaJobActionOptions) => Promise<NosanaApiStopJobResponse>;
  listBatch: (request: NosanaApiListJobBatchRequest, options: NosanaJobBatchOptions) => Promise<NosanaApiJobsBatchResponse>;
  extendBatch: (request: NosanaApiExtendJobBatchRequest, options: NosanaJobBatchOptions) => Promise<NosanaApiJobsBatchResponse>;
  stopBatch: (request: NosanaApiStopJobBatchRequest, options: NosanaJobBatchOptions) => Promise<NosanaApiJobsBatchResponse>;
}