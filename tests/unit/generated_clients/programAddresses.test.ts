import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'node:path';

import { NOSANA_JOBS_PROGRAM_ADDRESS } from '../../../src/generated_clients/jobs/programs/index.js';
import { NOSANA_STAKING_PROGRAM_ADDRESS } from '../../../src/generated_clients/staking/programs/index.js';
import { MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS } from '../../../src/generated_clients/merkle_distributor/programs/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idlDir = path.resolve(__dirname, '../../../idl');

function getProgramAddressFromIdl(idlFileName: string): string {
  const idlPath = path.join(idlDir, idlFileName);
  const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));
  return idl.metadata?.address || '';
}

describe('Generated Client Program Addresses', () => {
  const expectedJobsAddress = getProgramAddressFromIdl('nosana_jobs.json');
  const expectedStakingAddress = getProgramAddressFromIdl('nosana_stake.json');
  const expectedMerkleDistributorAddress = getProgramAddressFromIdl('merkle_distributor.json');

  it('should have NOSANA_JOBS_PROGRAM_ADDRESS populated and match IDL', () => {
    expect(NOSANA_JOBS_PROGRAM_ADDRESS).toBeDefined();
    expect(NOSANA_JOBS_PROGRAM_ADDRESS).not.toBe('');
    expect(NOSANA_JOBS_PROGRAM_ADDRESS).toBe(expectedJobsAddress);
  });

  it('should have NOSANA_STAKING_PROGRAM_ADDRESS populated and match IDL', () => {
    expect(NOSANA_STAKING_PROGRAM_ADDRESS).toBeDefined();
    expect(NOSANA_STAKING_PROGRAM_ADDRESS).not.toBe('');
    expect(NOSANA_STAKING_PROGRAM_ADDRESS).toBe(expectedStakingAddress);
  });

  it('should have MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS populated and match IDL', () => {
    expect(MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS).toBeDefined();
    expect(MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS).not.toBe('');
    expect(MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS).toBe(expectedMerkleDistributorAddress);
  });
});
