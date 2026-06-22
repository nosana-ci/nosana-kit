import type { components } from '../client/clientManagerSchema.js';

/**
 * Machine-readable control codes the API returns (as a `409` with the code in
 * the body, lifted onto {@link NosanaApiError.code}) for an idempotent request.
 *
 * The kit owns only this wire contract — *which* code maps to retry / fatal /
 * fresh-key is the caller's policy. Removing or renaming a member is a breaking
 * change, so consumers branching on these get a compile signal if they drift.
 *
 * The runtime constants are the value source; their union type is sourced from
 * the client-manager OpenAPI spec (`clientManagerSchema.ts`, regenerated via
 * `pnpm generate:types:client-manager:dev`). The lockstep assertion below makes
 * the two diverging a compile error, so the kit and the CM stay in sync.
 *
 * - `IN_PROGRESS` — a matching request is still in flight; retry the same key
 *   later (honouring `retryAfter`).
 * - `EXPIRED` — the prepared transaction is provably dead; re-post with a fresh key.
 * - `PAYLOAD_MISMATCH` — the same key was reused with a different payload; fatal.
 */
export const IdempotencyCode = {
  IN_PROGRESS: 'IDEMPOTENCY_KEY_IN_PROGRESS',
  EXPIRED: 'IDEMPOTENCY_KEY_EXPIRED',
  PAYLOAD_MISMATCH: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
} as const satisfies Record<string, IdempotencyCode>;

/** The control-code union, sourced directly from the CM OpenAPI spec. */
export type IdempotencyCode = components['schemas']['IdempotencyCode'];

// Compile-time lockstep: the runtime constants above must exactly cover the
// spec's enum. Regenerating clientManagerSchema.ts after the CM adds, removes,
// or renames a code breaks this assertion until the constants are updated.
// Exported only so it counts as "used"; intentionally not re-exported from the
// package root, so it is not part of the public API.
type _Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type _Assert<T extends true> = T;
export type _IdempotencyCodeMatchesSpec = _Assert<
  _Equal<(typeof IdempotencyCode)[keyof typeof IdempotencyCode], IdempotencyCode>
>;

/**
 * Generates a unique idempotency key suitable for the optional `idempotencyKey`
 * option on the jobs API (`list`, `extend`, `stop`).
 *
 * Reuse the returned value when retrying the *same* logical operation so the API
 * can de-duplicate the retry. Generate a fresh key for each new operation — a
 * different key per attempt provides no de-duplication.
 *
 * Uses the Web Crypto API, which is available in Node 20+ and modern browsers.
 *
 * @example
 * const key = generateIdempotencyKey();
 * await api.jobs.list(request, { idempotencyKey: key });
 * // ...later, retrying the SAME request:
 * await api.jobs.list(request, { idempotencyKey: key }); // de-duplicated
 */
export function generateIdempotencyKey(): string {
  return globalThis.crypto.randomUUID();
}
