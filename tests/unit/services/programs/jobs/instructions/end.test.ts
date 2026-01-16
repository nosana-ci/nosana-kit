import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Address } from '@solana/kit';

import { end } from '../../../../../../src/services/programs/jobs/instructions/end.js';
import * as programClient from '../../../../../../src/generated_clients/jobs/index.js';
import { createJobsProgram, JobState } from '../../../../../../src/services/programs/jobs/index.js';
import {
  AddressFactory,
  JobAccountFactory,
  MockClientFactory,
  RunAccountFactory,
  sdkToProgramDeps,
} from '../../../../../setup/index.js';

describe('end instruction', () => {
  let helperParams: Parameters<typeof end>[1];
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

  it('creates end instruction with required job', async () => {
    const walletAddr = AddressFactory.create(1);
    const jobAddr = AddressFactory.create(2);
    const marketAddr = AddressFactory.create(3);
    const payerAddr = AddressFactory.create(4);
    const nodeAddr = AddressFactory.create(5);
    const runAddr = AddressFactory.create(6);
    const vaultPda = AddressFactory.create(7);
    const payerATA = AddressFactory.create(8);
    const nodeATA = AddressFactory.create(9);
    const jobsProgram = config.programs.jobsAddress;

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    (helperParams.getNosATA as any) = vi
      .fn()
      .mockResolvedValueOnce(payerATA)
      .mockResolvedValueOnce(nodeATA);

    const jobAccount = JobAccountFactory.create({
      address: jobAddr,
      state: JobState.RUNNING,
    });
    jobAccount.data.market = marketAddr;
    jobAccount.data.payer = payerAddr;
    vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

    const runAccount = RunAccountFactory.create({
      address: runAddr,
      job: jobAddr,
      node: nodeAddr,
      payer: payerAddr,
      time: BigInt(Math.floor(Date.now() / 1000)),
    });
    vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
    (helperParams.deps.solana.rpc.getProgramAccounts as any) = vi.fn(() => ({
      send: vi.fn().mockResolvedValue([
        {
          pubkey: runAddr,
          account: {
            data: Buffer.from('mock-run-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: jobsProgram,
            rentEpoch: 0,
          },
        },
      ]),
    }));

    const endSpy = vi
      .spyOn(programClient, 'getEndInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await end({ job: jobAddr }, helperParams);

    expect(endSpy).toHaveBeenCalled();
    const args = endSpy.mock.calls[0][0] as any;
    expect(args.job).toBe(jobAddr);
    expect(args.market).toBe(marketAddr);
    expect(args.run).toBe(runAddr);
    expect(args.deposit).toBe(payerATA);
    expect(args.user).toBe(nodeATA);
    expect(args.vault).toBe(vaultPda);
    expect(args.payer).toBe(payerAddr);
    expect(args.authority).toBe(wallet);
    expect(instruction).toBeDefined();
  });

  it('throws error when no run account is found', async () => {
    const walletAddr = AddressFactory.create(10);
    const jobAddr = AddressFactory.create(11);
    const marketAddr = AddressFactory.create(12);
    const payerAddr = AddressFactory.create(13);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const jobAccount = JobAccountFactory.create({
      address: jobAddr,
      state: JobState.RUNNING,
    });
    jobAccount.data.market = marketAddr;
    jobAccount.data.payer = payerAddr;
    vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

    (helperParams.deps.solana.rpc.getProgramAccounts as any) = vi.fn(() => ({
      send: vi.fn().mockResolvedValue([]),
    }));

    await expect(end({ job: jobAddr }, helperParams)).rejects.toThrow(
      'No job run account found for the specified job'
    );
  });

  it('uses job payer for deposit ATA and run payer for payer account', async () => {
    const walletAddr = AddressFactory.create(32);
    const jobAddr = AddressFactory.create(33);
    const marketAddr = AddressFactory.create(34);
    const jobPayerAddr = AddressFactory.create(35);
    const runPayerAddr = AddressFactory.create(36);
    const nodeAddr = AddressFactory.create(37);
    const runAddr = AddressFactory.create(38);
    const vaultPda = AddressFactory.create(39);
    const jobPayerATA = AddressFactory.create(40);
    const nodeATA = AddressFactory.create(41);
    const jobsProgram = config.programs.jobsAddress;

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    (helperParams.getNosATA as any) = vi
      .fn()
      .mockResolvedValueOnce(jobPayerATA) // First call: job payer ATA for deposit
      .mockResolvedValueOnce(nodeATA); // Second call: node ATA for user

    const jobAccount = JobAccountFactory.create({
      address: jobAddr,
      state: JobState.RUNNING,
    });
    jobAccount.data.market = marketAddr;
    jobAccount.data.payer = jobPayerAddr; // Different from run payer
    vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

    const runAccount = RunAccountFactory.create({
      address: runAddr,
      job: jobAddr,
      node: nodeAddr,
      payer: runPayerAddr, // Different payer than job
      time: BigInt(Math.floor(Date.now() / 1000)),
    });
    vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
    (helperParams.deps.solana.rpc.getProgramAccounts as any) = vi.fn(() => ({
      send: vi.fn().mockResolvedValue([
        {
          pubkey: runAddr,
          account: {
            data: Buffer.from('mock-run-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: jobsProgram,
            rentEpoch: 0,
          },
        },
      ]),
    }));

    const endSpy = vi
      .spyOn(programClient, 'getEndInstruction' as any)
      .mockReturnValue(mockInstruction);

    const instruction = await end({ job: jobAddr }, helperParams);

    expect(endSpy).toHaveBeenCalled();
    const args = endSpy.mock.calls[0][0] as any;
    expect(args.deposit).toBe(jobPayerATA); // Should use job payer's ATA for deposit
    expect(args.payer).toBe(runPayerAddr); // Should use run payer for payer account
    expect(instruction).toBeDefined();
  });

  it('derives vault PDA from market and mint', async () => {
    const walletAddr = AddressFactory.create(14);
    const jobAddr = AddressFactory.create(15);
    const marketAddr = AddressFactory.create(16);
    const payerAddr = AddressFactory.create(17);
    const nodeAddr = AddressFactory.create(18);
    const runAddr = AddressFactory.create(19);
    const vaultPda = AddressFactory.create(20);
    const payerATA = AddressFactory.create(21);
    const nodeATA = AddressFactory.create(22);
    const mintAddr = config.programs.nosTokenAddress;
    const jobsProgram = config.programs.jobsAddress;

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    const pdaSpy = ((helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda));
    (helperParams.getNosATA as any) = vi
      .fn()
      .mockResolvedValueOnce(payerATA)
      .mockResolvedValueOnce(nodeATA);

    const jobAccount = JobAccountFactory.create({
      address: jobAddr,
      state: JobState.RUNNING,
    });
    jobAccount.data.market = marketAddr;
    jobAccount.data.payer = payerAddr;
    vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

    const runAccount = RunAccountFactory.create({
      address: runAddr,
      job: jobAddr,
      node: nodeAddr,
      payer: payerAddr,
      time: BigInt(Math.floor(Date.now() / 1000)),
    });
    vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
    (helperParams.deps.solana.rpc.getProgramAccounts as any) = vi.fn(() => ({
      send: vi.fn().mockResolvedValue([
        {
          pubkey: runAddr,
          account: {
            data: Buffer.from('mock-run-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: jobsProgram,
            rentEpoch: 0,
          },
        },
      ]),
    }));

    vi.spyOn(programClient, 'getEndInstruction' as any).mockReturnValue(mockInstruction);

    await end({ job: jobAddr }, helperParams);

    expect(pdaSpy).toHaveBeenCalled();
    expect(pdaSpy.mock.calls.length).toBeGreaterThan(0);
    const pdaCall = pdaSpy.mock.calls[0] as unknown as [Address[], Address];
    expect(pdaCall[0]).toEqual([marketAddr, mintAddr]);
    expect(pdaCall[1]).toBe(jobsProgram);
  });
});
