import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Address, generateKeyPairSigner } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

import { open } from '../../../../../../src/services/programs/jobs/instructions/open.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

// Test constants
const DEFAULT_JOB_EXPIRATION = 86400; // 24 hours in seconds
const DEFAULT_JOB_TIMEOUT = 7200; // 120 minutes in seconds
const DEFAULT_JOB_PRICE = 0;
const DEFAULT_JOB_TYPE = 0;
const DEFAULT_NODE_STAKE_MINIMUM = 0;

const CUSTOM_JOB_EXPIRATION = 172800; // 48 hours
const CUSTOM_JOB_TIMEOUT = 3600; // 60 minutes
const CUSTOM_JOB_PRICE = 1000;
const CUSTOM_JOB_TYPE = 1;
const CUSTOM_NODE_STAKE_MINIMUM = 5000000;

describe('open instruction', () => {
  let helperParams: Parameters<typeof open>[1];
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

  it('creates open instruction with default values', async () => {
    const walletAddr = AddressFactory.create(1);
    const vaultPda = AddressFactory.create(2);
    const mintAddr = config.programs.nosTokenAddress;

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);

    const openSpy = vi
      .spyOn(programClient, 'getOpenInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await open({}, helperParams);

    expect(openSpy).toHaveBeenCalled();
    const args = openSpy.mock.calls[0][0] as any;
    expect(args.mint).toBe(mintAddr);
    expect(args.market).toBeDefined();
    expect(args.vault).toBe(vaultPda);
    expect(args.authority).toBe(wallet);
    expect(args.accessKey).toBe(SYSTEM_PROGRAM_ADDRESS);
    expect(args.jobExpiration).toBe(DEFAULT_JOB_EXPIRATION);
    expect(args.jobTimeout).toBe(DEFAULT_JOB_TIMEOUT);
    expect(args.jobPrice).toBe(DEFAULT_JOB_PRICE);
    expect(args.jobType).toBe(DEFAULT_JOB_TYPE);
    expect(args.nodeXnosMinimum).toBe(DEFAULT_NODE_STAKE_MINIMUM);
    expect(instruction).toBeDefined();
  });

  it('creates open instruction with custom values', async () => {
    const walletAddr = AddressFactory.create(3);
    const vaultPda = AddressFactory.create(4);
    const accessKeyAddr = AddressFactory.create(5);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);

    const openSpy = vi
      .spyOn(programClient, 'getOpenInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await open(
      {
        nodeAccessKey: accessKeyAddr,
        jobExpiration: CUSTOM_JOB_EXPIRATION,
        jobTimeout: CUSTOM_JOB_TIMEOUT,
        jobPrice: CUSTOM_JOB_PRICE,
        jobType: CUSTOM_JOB_TYPE,
        nodeStakeMinimum: CUSTOM_NODE_STAKE_MINIMUM,
      },
      helperParams
    );

    expect(openSpy).toHaveBeenCalled();
    const args = openSpy.mock.calls[0][0] as any;
    expect(args.accessKey).toBe(accessKeyAddr);
    expect(args.jobExpiration).toBe(CUSTOM_JOB_EXPIRATION);
    expect(args.jobTimeout).toBe(CUSTOM_JOB_TIMEOUT);
    expect(args.jobPrice).toBe(CUSTOM_JOB_PRICE);
    expect(args.jobType).toBe(CUSTOM_JOB_TYPE);
    expect(args.nodeXnosMinimum).toBe(CUSTOM_NODE_STAKE_MINIMUM);
    expect(instruction).toBeDefined();
  });

  it('uses custom payer when provided', async () => {
    const walletAddr = AddressFactory.create(6);
    const vaultPda = AddressFactory.create(7);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    const payer = await generateKeyPairSigner();
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);

    const openSpy = vi
      .spyOn(programClient, 'getOpenInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await open({ payer }, helperParams);

    expect(openSpy).toHaveBeenCalled();
    const args = openSpy.mock.calls[0][0] as any;
    expect(args.authority).toBe(payer);
    expect(instruction).toBeDefined();
  });

  it('derives vault PDA from market and mint', async () => {
    const walletAddr = AddressFactory.create(8);
    const vaultPda = AddressFactory.create(9);
    const jobsProgram = config.programs.jobsAddress;

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    const pdaSpy = ((helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda));

    vi.spyOn(programClient, 'getOpenInstruction' as any).mockReturnValue(mockInstruction);

    await open({}, helperParams);

    expect(pdaSpy).toHaveBeenCalled();
    expect(pdaSpy.mock.calls.length).toBeGreaterThan(0);
    const pdaCall = pdaSpy.mock.calls[0] as unknown as [Address[], Address];
    expect(pdaCall[0]).toHaveLength(2);
    expect(pdaCall[1]).toBe(jobsProgram);
  });
});
