import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'node:path';

import { NOSANA_JOBS_PROGRAM_ADDRESS } from '@nosana/jobs-program';
import { NOSANA_STAKING_PROGRAM_ADDRESS } from '@nosana/stake-program';
import { MERKLE_DISTRIBUTOR_PROGRAM_ADDRESS } from '@nosana/merkle-distributor-program';
import { NOSANA_REWARDS_PROGRAM_ADDRESS } from '@nosana/rewards-program';
import { NOSANA_POOLS_PROGRAM_ADDRESS } from '@nosana/pools-program';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const idlDir = path.resolve(__dirname, '../../../../../idl');

function getProgramAddressFromIdl(idlFileName: string): string {
  const idlPath = path.join(idlDir, idlFileName);
  const idl = JSON.parse(readFileSync(idlPath, 'utf-8'));
  // Legacy Anchor IDLs carry the address in `metadata`, Anchor >= 0.30 IDLs at the top level.
  return idl.address || idl.metadata?.address || '';
}

describe('Generated Client Program Addresses', () => {
  const expectedJobsAddress = getProgramAddressFromIdl('nosana_jobs.json');
  const expectedStakingAddress = getProgramAddressFromIdl('nosana_stake.json');
  const expectedMerkleDistributorAddress = getProgramAddressFromIdl('merkle_distributor.json');
  const expectedRewardsAddress = getProgramAddressFromIdl('nosana_rewards.json');
  const expectedPoolsAddress = getProgramAddressFromIdl('nosana_pools.json');

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

  it('should have NOSANA_REWARDS_PROGRAM_ADDRESS populated and match IDL', () => {
    expect(NOSANA_REWARDS_PROGRAM_ADDRESS).toBeDefined();
    expect(NOSANA_REWARDS_PROGRAM_ADDRESS).not.toBe('');
    expect(NOSANA_REWARDS_PROGRAM_ADDRESS).toBe(expectedRewardsAddress);
  });

  it('should have NOSANA_POOLS_PROGRAM_ADDRESS populated and match IDL', () => {
    expect(NOSANA_POOLS_PROGRAM_ADDRESS).toBeDefined();
    expect(NOSANA_POOLS_PROGRAM_ADDRESS).not.toBe('');
    expect(NOSANA_POOLS_PROGRAM_ADDRESS).toBe(expectedPoolsAddress);
  });
});
