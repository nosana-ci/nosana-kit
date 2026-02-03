import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';

import { list } from '../../../../../../src/services/programs/jobs/instructions/list.js';
import * as programClient from '../../../../../../src/generated_clients/jobs/index.js';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../../setup/index.js';

const IPFS_BYTES_LENGTH = 32;

describe('list instruction', () => {
  let helperParams: Parameters<typeof list>[1];
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

  it('creates list instruction with ipfsHashToSolBytesArray and PDAs', async () => {
    const walletAddr = AddressFactory.create(70);
    const vaultPda = AddressFactory.create(80);
    const programAddr = AddressFactory.create(73);
    const marketAddr = AddressFactory.create(74);
    const timeout = 1000;
    const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
    const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);

    const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
      programAddress: programAddr,
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instr = await list({ market: marketAddr, timeout, ipfsHash: ipfsCid }, helperParams);

    // Assert - verify behavior: instruction is created with correct IPFS bytes using ipfsHashToSolBytesArray
    expect(listSpy).toHaveBeenCalled();
    const args = listSpy.mock.calls[0][0] as any;
    expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
    expect(instr).toBeDefined();
  });
});
