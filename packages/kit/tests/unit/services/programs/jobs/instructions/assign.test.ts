import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';

import { assign } from '../../../../../../src/services/programs/jobs/instructions/assign.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

const IPFS_BYTES_LENGTH = 32;

describe('assign instruction', () => {
  let helperParams: Parameters<typeof assign>[1];
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

  it('creates assign instruction with ipfsHashToSolBytesArray and PDAs', async () => {
    const walletAddr = AddressFactory.create(75);
    const vaultPda = AddressFactory.create(81);
    const programAddr = AddressFactory.create(77);
    const marketAddr = AddressFactory.create(78);
    const nodeAddr = AddressFactory.create(79);
    const timeout = 2000;
    const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i + 10);
    const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);

    const assignSpy = vi.spyOn(programClient, 'getAssignInstruction' as any).mockReturnValue({
      programAddress: programAddr,
      accounts: [],
      data: new Uint8Array([2]),
    });

    // Act
    const instr = await assign(
      {
        market: marketAddr,
        timeout,
        ipfsHash: ipfsCid,
        node: nodeAddr,
      },
      helperParams
    );

    // Assert - verify behavior: instruction is created with correct IPFS bytes using ipfsHashToSolBytesArray
    expect(assignSpy).toHaveBeenCalled();
    const args = assignSpy.mock.calls[0][0] as any;
    expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
    expect(args.node).toBe(nodeAddr);
    expect(instr).toBeDefined();
  });
});
