import type { Instruction } from '@solana/kit';
import { JOBS_COMPUTE_UNITS } from './computeUnits.generated.js';
import { getJobsInstructionName } from './discriminators.js';

/**
 * Resolve the compute-unit cost of a jobs instruction by matching its 8-byte
 * Anchor discriminator against the generated {@link JOBS_COMPUTE_UNITS} table.
 *
 * Works on any raw {@link Instruction} regardless of how it was built, so it can
 * price a mixed batch. Returns a default value for instructions that are not jobs
 * instructions (or whose cost has not been measured), letting the caller apply a
 * fallback.
 *
 * @param instruction The instruction to price.
 * @returns The estimated compute units, or a default value if unknown.
 * @group @nosana/kit
 */
export function getJobsInstructionComputeUnits(instruction: Instruction): number {
  const name = getJobsInstructionName(instruction);
  return name ? JOBS_COMPUTE_UNITS[name] : 200000;
}
