/**
 * Predicate strings consumed by typia tag validators.
 *
 * This module MUST NOT import `typia` or call any typia validator factory.
 * It is imported directly by tests (via `new Function`) so that asserting on a
 * rule never triggers the typia transform — which is only applied by the `tsc`
 * build, not by vitest.
 */

// Operation ID – mirrors @nosana/sdk/src/types/job.ts
export const OPERATION_ID_VALIDATE =
  `typeof $input === "string" && !$input.includes(" ")` as const;
