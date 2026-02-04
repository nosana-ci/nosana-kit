import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';

import { complete } from '../../../../../../src/services/programs/jobs/instructions/complete.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram, JobState } from '../../../../../../src/services/programs/jobs/index.js';
import {
  AddressFactory,
  JobAccountFactory,
  MockClientFactory,
  sdkToProgramDeps,
} from '../../../../../setup/index.js';

const IPFS_BYTES_LENGTH = 32;

describe('complete instruction', () => {
  let helperParams: Parameters<typeof complete>[1];
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];
  let jobs: ReturnType<typeof createJobsProgram>;

  beforeEach(() => {
    const sdk = MockClientFactory.createBasic();
    const deps = sdkToProgramDeps(sdk);
    config = sdk.config;
    jobs = createJobsProgram(deps, config.programs);

    helperParams = {
      deps,
      config: config.programs,
      client: programClient,
      get: jobs.get.bind(jobs),
      getRuns: jobs.runs.bind(jobs),
      getRequiredWallet: () => {
        const wallet = deps.getWallet();
        if (!wallet) {
          throw new Error('Wallet is required');
        }
        return wallet;
      },
      getStaticAccounts: async () => {
        const jobsProgram = config.programs.jobsAddress;
        const rewardsProgram = config.programs.rewardsAddress;
        return {
          jobsProgram,
          rewardsProgram,
          rewardsReflection: AddressFactory.create(999),
          rewardsVault: AddressFactory.create(998),
        };
      },
      getNosATA: sdk.nos.getATA.bind(sdk.nos),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates complete instruction with decoded ipfsResult and correct accounts', async () => {
    const walletAddr = AddressFactory.create(240);
    const jobAddr = AddressFactory.create(241);
    const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
    const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const jobAccount = JobAccountFactory.create({
      address: jobAddr,
      state: JobState.COMPLETED,
    });
    jobAccount.data.ipfsResult = new Uint8Array(IPFS_BYTES_LENGTH).fill(0);
    vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

    const completeSpy = vi.spyOn(programClient, 'getCompleteInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(242),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instruction = await complete({ job: jobAddr, ipfsResultsHash: ipfsCid }, helperParams);

    // Assert - verify behavior
    expect(completeSpy).toHaveBeenCalled();
    const args = completeSpy.mock.calls[0][0] as any;
    expect(Array.from(args.ipfsResult)).toEqual(ipfsBytes);
    expect(args.ipfsResult).toHaveLength(IPFS_BYTES_LENGTH);
    expect(args.job).toBe(jobAddr);
    expect(args.authority).toBe(wallet);
    expect(instruction).toBeDefined();
  });
});
