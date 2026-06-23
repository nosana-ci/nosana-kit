// Build-time-only lockstep between the runtime `IdempotencyCode` constants and
// the client-manager OpenAPI spec. This file is type-checked by `tsc --build`
// (it is matched by the package's `src/**/*` include) but is intentionally NOT
// exported from the package entry and NOT imported by anything reachable from
// it. That keeps the large generated `clientManagerSchema` out of consumers'
// (and the docs' twoslash) type graph, while still failing the build if the kit
// constants ever drift from the spec.
//
// Regenerate the spec with `pnpm generate:types:client-manager:dev`.
import { IdempotencyCode } from '../utils/idempotency.js';

import type {
  NosanaApiExtendJobResponse,
  NosanaApiStopJobResponse,
} from '../routes/jobs/types.js';

import type {
  NosanaApiJobsBatchResponse,
  NosanaApiListJobBatchRequest,
  NosanaApiExtendJobBatchRequest,
  NosanaApiStopJobBatchRequest,
} from './jobsBatch.js';
import type { components, operations } from './clientManagerSchema.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;

type JsonBody<O> = O extends { requestBody: { content: { 'application/json': infer B } } } ? B : never;

// Errors if the runtime constants and the spec's enum diverge in either
// direction (a code added, removed, or renamed in the spec).
export type IdempotencyCodeMatchesSpec = Assert<
  Equal<(typeof IdempotencyCode)[keyof typeof IdempotencyCode], components['schemas']['IdempotencyCode']>
>;

// Errors if the hand-defined batch wire types drift from the spec.
export type JobsBatchResponseMatchesSpec = Assert<
  Equal<NosanaApiJobsBatchResponse, components['schemas']['JobsBatchResponse']>
>;
export type ListJobBatchRequestMatchesSpec = Assert<
  Equal<NosanaApiListJobBatchRequest, JsonBody<operations['postJobsListBatch']>>
>;
export type ExtendJobBatchRequestMatchesSpec = Assert<
  Equal<NosanaApiExtendJobBatchRequest, JsonBody<operations['postJobsExtendBatch']>>
>;
export type StopJobBatchRequestMatchesSpec = Assert<
  Equal<NosanaApiStopJobBatchRequest, JsonBody<operations['postJobsStopBatch']>>
>;

// Errors if the hand-defined single-op response types drift from the spec.
export type ExtendJobResponseMatchesSpec = Assert<
  Equal<NosanaApiExtendJobResponse, components['schemas']['ExtendJobWithCreditsResponse']>
>;
export type StopJobResponseMatchesSpec = Assert<
  Equal<NosanaApiStopJobResponse, components['schemas']['StopJobWithCreditsResponse']>
>;
