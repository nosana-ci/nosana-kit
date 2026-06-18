import { describe, it, expect } from 'vitest';
import { type Instruction, AccountRole, address } from '@solana/kit';
import { LIST_DISCRIMINATOR, COMPLETE_DISCRIMINATOR } from '@nosana/jobs-program';

import { getJobsInstructionComputeUnits } from '../../../../../src/services/programs/jobs/computeUnits.js';
import { JOBS_COMPUTE_UNITS } from '../../../../../src/services/programs/jobs/computeUnits.generated.js';

const PROGRAM = address('ComputeBudget111111111111111111111111111111');

function makeIx(data: Uint8Array): Instruction {
  return {
    programAddress: PROGRAM,
    accounts: [{ address: PROGRAM, role: AccountRole.READONLY }],
    data,
  };
}

describe('getJobsInstructionComputeUnits', () => {
  it('prices a jobs instruction by its discriminator', () => {
    const ix = makeIx(new Uint8Array([...LIST_DISCRIMINATOR, 1, 2, 3, 4]));
    expect(getJobsInstructionComputeUnits(ix)).toBe(JOBS_COMPUTE_UNITS.list);
  });

  it('matches each known instruction to its table value', () => {
    const completeIx = makeIx(new Uint8Array([...COMPLETE_DISCRIMINATOR]));
    expect(getJobsInstructionComputeUnits(completeIx)).toBe(JOBS_COMPUTE_UNITS.complete);
  });

  it('returns undefined for an unknown (non-jobs) instruction', () => {
    const ix = makeIx(new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9, 0, 0]));
    expect(getJobsInstructionComputeUnits(ix)).toBeUndefined();
  });

  it('returns undefined when the instruction data is shorter than a discriminator', () => {
    const ix = makeIx(new Uint8Array([1, 2, 3]));
    expect(getJobsInstructionComputeUnits(ix)).toBeUndefined();
  });
});
