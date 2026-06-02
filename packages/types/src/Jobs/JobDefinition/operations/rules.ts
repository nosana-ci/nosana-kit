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

export const OPS_UNIQUE_BY_ID_VALIDATE = `Array.isArray($input) && (()=>{
    const seen = new Set();
    for (const it of $input) {
      if (typeof it?.id !== "string") return false;
      if (seen.has(it.id)) return false;
      seen.add(it.id);
    }
    return true;
  })()` as const;
