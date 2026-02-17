import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

import { work } from '../../../../../../src/services/programs/jobs/instructions/work.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../../setup/index.js';

describe('work instruction', () => {
  let helperParams: Parameters<typeof work>[1];
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

  it('creates work instruction without NFT using NOS token ATA', async () => {
    const walletAddr = AddressFactory.create(200);
    const marketAddr = AddressFactory.create(201);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const workSpy = vi.spyOn(programClient, 'getWorkInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(204),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instr = await work({ market: marketAddr }, helperParams);

    // Assert - verify behavior: instruction is created with correct accounts
    expect(workSpy).toHaveBeenCalled();
    const args = workSpy.mock.calls[0][0] as any;
    expect(args.market).toBe(marketAddr);
    expect(args.metadata).toBe(SYSTEM_PROGRAM_ADDRESS);
    expect(args.nft).toBeDefined();
    expect(args.stake).toBeDefined();
    expect(args.payer).toBe(wallet);
    expect(args.authority).toBe(wallet);
    expect(args.run).toBeDefined();
    expect(instr).toBeDefined();
  });

  it('creates work instruction with NFT using NFT ATA and metadata PDA', async () => {
    const walletAddr = AddressFactory.create(210);
    const marketAddr = AddressFactory.create(211);
    const nftMint = AddressFactory.create(212);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const workSpy = vi.spyOn(programClient, 'getWorkInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(216),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instr = await work({ market: marketAddr, nft: nftMint }, helperParams);

    // Assert - verify behavior: instruction is created with correct accounts
    expect(workSpy).toHaveBeenCalled();
    const args = workSpy.mock.calls[0][0] as any;
    expect(args.market).toBe(marketAddr);
    expect(args.nft).toBeDefined();
    expect(args.metadata).toBeDefined();
    expect(args.stake).toBeDefined();
    expect(args.payer).toBe(wallet);
    expect(args.authority).toBe(wallet);
    expect(args.run).toBeDefined();
    expect(instr).toBeDefined();
  });
});
