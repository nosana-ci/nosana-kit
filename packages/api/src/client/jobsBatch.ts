// Batch jobs endpoints.
//
// The client-manager exposes these at `/jobs/{list,extend,stop}/batch`; the
// dashboard proxies them under its `/api/jobs` prefix, so that's what the SDK
// calls. Types are hand-defined here (not sourced from the generated
// `clientManagerSchema`) so the large generated schema stays out of the public,
// type-checked graph — they're kept in lockstep with the CM OpenAPI spec by the
// build-only assertion in `clientManagerSchema.lockstep.ts`.

/** Per-item result of a jobs batch operation, addressed by request `index`. */
export interface NosanaApiJobsBatchItem {
  index: number;
  status: 'confirmed' | 'expired';
  job?: string;
  run?: string;
  /**
   * On-chain transaction signature (base58). Items packed into the same
   * transaction share one `tx`; absent on `expired` items and on already-terminal
   * no-ops (nothing was sent).
   */
  tx?: string;
}

/** Response shape shared by all jobs batch endpoints. */
export interface NosanaApiJobsBatchResponse {
  items: NosanaApiJobsBatchItem[];
}

export interface NosanaApiListJobBatchRequest {
  jobs: { ipfsHash: string; market: string; timeout?: number }[];
}

export interface NosanaApiExtendJobBatchRequest {
  jobs: { jobAddress: string; seconds: number }[];
}

export interface NosanaApiStopJobBatchRequest {
  jobs: { jobAddress: string }[];
}

type BatchOperation<Body> = {
  parameters: { query?: never; header?: never; path?: never; cookie?: never };
  requestBody: { content: { 'application/json': Body } };
  responses: { 200: { content: { 'application/json': NosanaApiJobsBatchResponse } } };
};

/**
 * The proxied batch endpoints, shaped like an openapi-typescript `paths` map so
 * they can be merged into the dashboard client's path type.
 */
export interface JobsBatchPaths {
  '/api/jobs/list/batch': { post: BatchOperation<NosanaApiListJobBatchRequest> };
  '/api/jobs/extend/batch': { post: BatchOperation<NosanaApiExtendJobBatchRequest> };
  '/api/jobs/stop/batch': { post: BatchOperation<NosanaApiStopJobBatchRequest> };
}
