import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Address, generateKeyPairSigner } from '@solana/kit';

import { close } from '../../../../../../src/services/programs/jobs/instructions/close.js';
import * as programClient from '../../../../../../src/generated_clients/jobs/index.js';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../../setup/index.js';

describe('close instruction', () => {
  let helperParams: Parameters<typeof close>[1];
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];
  let jobs: ReturnType<typeof createJobsProgram>;
  let mockInstruction: any;

  beforeEach(() => {
    const sdk = MockClientFactory.createBasic();
    const deps = sdkToProgramDeps(sdk);
    config = sdk.config;
    jobs = createJobsProgram(deps, config.programs);

    mockInstruction = {
      programAddress: AddressFactory.create(999),
      accounts: [],
      data: new Uint8Array([1]),
    };

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
          rewardsReflection: AddressFactory.create(998),
          rewardsVault: AddressFactory.create(997),
        };
      },
      getNosATA: sdk.nos.getATA.bind(sdk.nos),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates close instruction with required market', async () => {
    const walletAddr = AddressFactory.create(1);
    const marketAddr = AddressFactory.create(2);
    const vaultPda = AddressFactory.create(3);
    const userATA = AddressFactory.create(4);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    (helperParams.getNosATA as any) = vi.fn(async () => userATA);

    const closeSpy = vi
      .spyOn(programClient, 'getCloseInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await close({ market: marketAddr }, helperParams);

    expect(closeSpy).toHaveBeenCalled();
    const args = closeSpy.mock.calls[0][0] as any;
    expect(args.market).toBe(marketAddr);
    expect(args.vault).toBe(vaultPda);
    expect(args.user).toBe(userATA);
    expect(args.authority).toBe(wallet);
    expect(instruction).toBeDefined();
  });

  it('uses custom payer when provided', async () => {
    const walletAddr = AddressFactory.create(5);
    const marketAddr = AddressFactory.create(6);
    const vaultPda = AddressFactory.create(7);
    const userATA = AddressFactory.create(8);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    const payer = await generateKeyPairSigner();
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    const getATASpy = ((helperParams.getNosATA as any) = vi.fn(async () => userATA));

    const closeSpy = vi
      .spyOn(programClient, 'getCloseInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await close({ market: marketAddr, payer }, helperParams);

    expect(closeSpy).toHaveBeenCalled();
    const args = closeSpy.mock.calls[0][0] as any;
    expect(args.authority).toBe(payer);
    expect(getATASpy).toHaveBeenCalledWith(payer.address);
    expect(instruction).toBeDefined();
  });

  it('derives vault PDA from market and mint', async () => {
    const walletAddr = AddressFactory.create(9);
    const marketAddr = AddressFactory.create(10);
    const vaultPda = AddressFactory.create(11);
    const userATA = AddressFactory.create(12);
    const mintAddr = config.programs.nosTokenAddress;
    const jobsProgram = config.programs.jobsAddress;

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    const pdaSpy = ((helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda));
    (helperParams.getNosATA as any) = vi.fn(async () => userATA);

    vi.spyOn(programClient, 'getCloseInstruction' as any).mockReturnValue(mockInstruction);

    await close({ market: marketAddr }, helperParams);

    expect(pdaSpy).toHaveBeenCalled();
    expect(pdaSpy.mock.calls.length).toBeGreaterThan(0);
    const pdaCall = pdaSpy.mock.calls[0] as unknown as [Address[], Address];
    expect(pdaCall[0]).toEqual([marketAddr, mintAddr]);
    expect(pdaCall[1]).toBe(jobsProgram);
  });

  it('gets user ATA for wallet address', async () => {
    const walletAddr = AddressFactory.create(13);
    const marketAddr = AddressFactory.create(14);
    const vaultPda = AddressFactory.create(15);
    const userATA = AddressFactory.create(16);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    const getATASpy = ((helperParams.getNosATA as any) = vi.fn(async () => userATA));

    vi.spyOn(programClient, 'getCloseInstruction' as any).mockReturnValue(mockInstruction);

    await close({ market: marketAddr }, helperParams);

    expect(getATASpy).toHaveBeenCalledWith(walletAddr);
  });
});
