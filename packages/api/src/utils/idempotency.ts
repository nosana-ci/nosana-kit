/**
 * Machine-readable control codes the API returns (as a `409` with the code in
 * the body, lifted onto {@link NosanaApiError.code}) for an idempotent request.
 *
 * The kit owns only this wire contract — *which* code maps to retry / fatal /
 * fresh-key is the caller's policy. Removing or renaming a member is a breaking
 * change, so consumers branching on these get a compile signal if they drift.
 *
 * These constants are kept in lockstep with the client-manager OpenAPI spec by a
 * compile-time assertion in `../client/clientManagerSchema.lockstep.ts` (which
 * is intentionally *not* part of the public import graph, so the large generated
 * schema stays out of consumers' type graph). Regenerate the schema with
 * `pnpm generate:types:client-manager:dev`.
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
} as const;

export type IdempotencyCode = (typeof IdempotencyCode)[keyof typeof IdempotencyCode];

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
