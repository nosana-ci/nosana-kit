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
