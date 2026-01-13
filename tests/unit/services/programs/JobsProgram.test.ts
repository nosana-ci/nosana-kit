import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Address } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';

import {
  createJobsProgram,
  type JobsProgram,
  JobState,
  MarketQueueType,
  MonitorEventType,
} from '../../../../src/services/programs/jobs/index.js';
import * as programClient from '../../../../src/generated_clients/jobs/index.js';
import {
  AddressFactory,
  MockClientFactory,
  JobAccountFactory,
  RunAccountFactory,
  MarketAccountFactory,
  sdkToProgramDeps,
} from '../../../setup/index.js';

// Test constants
const DEFAULT_JOB_PRICE = 1;
const DEFAULT_TIME = 0;
const DEFAULT_JOB_TIMEOUT = 200;
const DEFAULT_MARKET_JOB_PRICE = 10;
const RUN_TIME_888 = 888;
const RUN_TIME_555 = 555;
const RUN_TIME_777 = 777;
const IPFS_BYTES_LENGTH = 32;

// Helper functions
const baseSdk = () => MockClientFactory.createBasic();
const newAddr = (seed?: number) => AddressFactory.create(seed);
const makeJobAccount = (state: number, addr?: Address) =>
  JobAccountFactory.create({ state, address: addr });
const makeRunAccount = (job: Address, time: number, node?: Address) =>
  RunAccountFactory.create({ job, time: BigInt(time), node });
const makeMarketAccount = () => MarketAccountFactory.create();
const makeMonitorSdk = () => MockClientFactory.createMockWithSubscriptions();

describe('JobsProgram', () => {
  describe('transforms', () => {
    let jobs: JobsProgram;

    beforeEach(() => {
      const sdk = baseSdk();
      jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    it('get converts bigint and ipfs bytes and casts state', async () => {
      const addr = newAddr(9);
      const acc = makeJobAccount(JobState.COMPLETED, addr);

      vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(acc);

      const out = await jobs.get(addr, false);
      expect(out.address).toBe(acc.address);
      expect(out.price).toBe(DEFAULT_JOB_PRICE);
      expect(out.timeStart).toBe(DEFAULT_TIME);
      expect(out.timeEnd).toBe(DEFAULT_TIME);
      expect(out.timeout).toBe(DEFAULT_TIME);
      expect(out.state).toBe(JobState.COMPLETED);
      expect(out.ipfsJob).toBeTypeOf('string');
      expect((out.ipfsJob as string).length).toBeGreaterThan(IPFS_BYTES_LENGTH);
    });

    it('run converts fields to number', async () => {
      const addr = newAddr(10);
      const jobAddr = newAddr(11);
      const nodeAddr = newAddr(12);
      const runTime = 999;
      const acc = makeRunAccount(jobAddr, runTime, nodeAddr);

      vi.spyOn(programClient, 'fetchRunAccount' as any).mockResolvedValue(acc);

      const out = await jobs.run(addr);
      expect(out.address).toBe(acc.address);
      expect(out.time).toBe(runTime);
    });

    it('market casts queueType and converts numbers', async () => {
      const addr = newAddr(13);
      const acc = MarketAccountFactory.create({ address: addr });

      vi.spyOn(programClient, 'fetchMarketAccount' as any).mockResolvedValue(acc);

      const out = await jobs.market(addr);
      expect(out.address).toBe(addr);
      expect(out.jobPrice).toBe(DEFAULT_MARKET_JOB_PRICE);
      expect(out.jobTimeout).toBe(DEFAULT_JOB_TIMEOUT);
      expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
    });
  });

  describe('methods', () => {
    let sdk: ReturnType<typeof MockClientFactory.createMockWithRpc>['sdk'];
    let jobs: JobsProgram;

    beforeEach(() => {
      const ctx = MockClientFactory.createMockWithRpc();
      sdk = ctx.sdk;
      jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('get, run, market', () => {
      it('run fetches and transforms single run account', async () => {
        const addr = newAddr(100);
        const jobAddr = newAddr(101);
        vi.spyOn(programClient, 'fetchRunAccount' as any).mockResolvedValue(
          makeRunAccount(jobAddr, RUN_TIME_888)
        );
        const out = await jobs.run(addr);
        expect(out.address).toBeDefined();
        expect(out.time).toBe(RUN_TIME_888);
      });

      it('market fetches and transforms single market account', async () => {
        const addr = newAddr(101);
        vi.spyOn(programClient, 'fetchMarketAccount' as any).mockResolvedValue(makeMarketAccount());
        const out = await jobs.market(addr);
        expect(out.address).toBeDefined();
        expect(out.jobPrice).toBe(DEFAULT_MARKET_JOB_PRICE);
        expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
      });
    });

    describe('get and multiple (checkRuns)', () => {
      it('get does not check runs when checkRun is false', async () => {
        const addr = newAddr(60);
        const jobAccount = makeJobAccount(JobState.QUEUED, addr);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

        // Mock RPC to ensure runs() would not be called
        const getProgramAccountsSpy = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([]),
        }));
        sdk.solana.rpc.getProgramAccounts = getProgramAccountsSpy as any;

        const out = await jobs.get(addr, false);

        // Verify behavior: job state remains QUEUED when checkRun is false
        expect(out.state).toBe(JobState.QUEUED);
        // Verify runs() was not called by checking RPC was not called
        expect(getProgramAccountsSpy).not.toHaveBeenCalled();
      });

      it('get leaves non-queued jobs unchanged even when checkRun is true', async () => {
        const addr = newAddr(61);
        const jobAccount = makeJobAccount(JobState.COMPLETED, addr);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

        const getProgramAccountsSpy = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([]),
        }));
        sdk.solana.rpc.getProgramAccounts = getProgramAccountsSpy as any;

        const out = await jobs.get(addr, true);

        // Verify behavior: completed jobs don't check for runs
        expect(out.state).toBe(JobState.COMPLETED);
        expect(getProgramAccountsSpy).not.toHaveBeenCalled();
      });

      it('multiple does not check runs when checkRuns is false', async () => {
        const a = newAddr(62);
        const b = newAddr(63);
        vi.spyOn(programClient, 'fetchAllJobAccount' as any).mockResolvedValue([
          makeJobAccount(JobState.QUEUED, a),
          makeJobAccount(JobState.QUEUED, b),
        ]);

        const getProgramAccountsSpy = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([]),
        }));
        sdk.solana.rpc.getProgramAccounts = getProgramAccountsSpy as any;

        const out = await jobs.multiple([a, b], false);

        // Verify behavior: all jobs remain QUEUED
        expect(out.every((j) => j.state === JobState.QUEUED)).toBe(true);
        expect(out).toHaveLength(2);
        expect(getProgramAccountsSpy).not.toHaveBeenCalled();
      });

      it('get sets RUNNING and timeStart when checkRun is true and a run exists', async () => {
        const addr = newAddr(10);
        const nodeAddr = newAddr(26);
        const runAddr = newAddr(25);
        const jobAccount = makeJobAccount(JobState.QUEUED, addr);
        const runAccount = makeRunAccount(addr, RUN_TIME_555, nodeAddr);

        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

        // Mock RPC to return run account when runs() is called
        vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
        const mockRpcResponse = [
          {
            pubkey: runAddr,
            account: {
              data: Buffer.from('mock-run-data').toString('base64'),
              executable: false,
              lamports: 1000000,
              owner: sdk.config.programs.jobsAddress,
              rentEpoch: 0,
            },
          },
        ];
        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockRpcResponse),
        })) as any;

        const out = await jobs.get(addr, true);

        // Verify behavior: job state changes to RUNNING when run exists
        expect(out.state).toBe(JobState.RUNNING);
        expect(out.timeStart).toBe(RUN_TIME_555);
        expect(out.node).toBe(nodeAddr);
      });

      it('multiple applies runs mapping only to queued jobs when checkRuns is true', async () => {
        const a = newAddr(11);
        const b = newAddr(12);
        const runAddr = newAddr(30);
        const nodeAddr = newAddr(31);
        const runAccount = makeRunAccount(a, RUN_TIME_777, nodeAddr);

        vi.spyOn(programClient, 'fetchAllJobAccount' as any).mockResolvedValue([
          makeJobAccount(JobState.QUEUED, a),
          makeJobAccount(JobState.COMPLETED, b),
        ]);

        // Mock RPC to return run account
        vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
        const mockRpcResponse = [
          {
            pubkey: runAddr,
            account: {
              data: Buffer.from('mock-run-data').toString('base64'),
              executable: false,
              lamports: 1000000,
              owner: sdk.config.programs.jobsAddress,
              rentEpoch: 0,
            },
          },
        ];
        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockRpcResponse),
        })) as any;

        const out = await jobs.multiple([a, b], true);

        // Verify behavior: queued job becomes RUNNING, completed job stays COMPLETED
        const first = out.find((j) => j.address === a)!;
        const second = out.find((j) => j.address === b)!;
        expect(first.state).toBe(JobState.RUNNING);
        expect(first.timeStart).toBe(RUN_TIME_777);
        expect(second.state).toBe(JobState.COMPLETED);
      });
    });

    describe('list', () => {
      it('creates list instruction with ipfsHashToSolBytesArray and PDAs', async () => {
        // Test constants
        const walletAddr = newAddr(70);
        const vaultPda = newAddr(80);
        const programAddr = newAddr(73);
        const marketAddr = newAddr(74);
        const timeout = 1000;
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
        const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => vaultPda);
        // Mock client.getListInstruction (generated client - acceptable to mock)
        const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
          programAddress: programAddr,
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act
        const instr = await jobs.list({ market: marketAddr, timeout, ipfsHash: ipfsCid });

        // Assert - verify behavior: instruction is created with correct IPFS bytes using ipfsHashToSolBytesArray
        expect(listSpy).toHaveBeenCalled();
        const args = listSpy.mock.calls[0][0] as any;
        expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
        expect(instr).toBeDefined();
      });
    });

    describe('assign', () => {
      it('creates assign instruction with ipfsHashToSolBytesArray and PDAs', async () => {
        // Test constants
        const walletAddr = newAddr(75);
        const vaultPda = newAddr(81);
        const programAddr = newAddr(77);
        const marketAddr = newAddr(78);
        const nodeAddr = newAddr(79);
        const timeout = 2000;
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i + 10);
        const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => vaultPda);
        // Mock client.getAssignInstruction (generated client - acceptable to mock)
        const assignSpy = vi.spyOn(programClient, 'getAssignInstruction' as any).mockReturnValue({
          programAddress: programAddr,
          accounts: [],
          data: new Uint8Array([2]),
        });

        // Act
        const instr = await jobs.assign({
          market: marketAddr,
          timeout,
          ipfsHash: ipfsCid,
          node: nodeAddr,
        });

        // Assert - verify behavior: instruction is created with correct IPFS bytes using ipfsHashToSolBytesArray
        expect(assignSpy).toHaveBeenCalled();
        const args = assignSpy.mock.calls[0][0] as any;
        expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
        expect(args.node).toBe(nodeAddr);
        expect(instr).toBeDefined();
      });
    });

    describe('post', () => {
      it('creates list instruction when node is not provided', async () => {
        // Test constants
        const walletAddr = newAddr(82);
        const vaultPda = newAddr(83);
        const programAddr = newAddr(85);
        const marketAddr = newAddr(86);
        const timeout = 3000;
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i + 20);
        const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => vaultPda);
        // Mock client.getListInstruction (generated client - acceptable to mock)
        const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
          programAddress: programAddr,
          accounts: [],
          data: new Uint8Array([1]),
        });
        const assignSpy = vi.spyOn(programClient, 'getAssignInstruction' as any);

        // Act
        const instr = await jobs.post({ market: marketAddr, timeout, ipfsHash: ipfsCid });

        // Assert - verify behavior: post creates list instruction when node is not provided
        expect(listSpy).toHaveBeenCalled();
        expect(assignSpy).not.toHaveBeenCalled();
        const args = listSpy.mock.calls[0][0] as any;
        expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
        expect(instr).toBeDefined();
      });

      it('creates assign instruction when node is provided', async () => {
        // Test constants
        const walletAddr = newAddr(87);
        const vaultPda = newAddr(88);
        const programAddr = newAddr(90);
        const marketAddr = newAddr(91);
        const nodeAddr = newAddr(92);
        const timeout = 4000;
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i + 30);
        const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => vaultPda);
        // Mock client.getAssignInstruction (generated client - acceptable to mock)
        const assignSpy = vi.spyOn(programClient, 'getAssignInstruction' as any).mockReturnValue({
          programAddress: programAddr,
          accounts: [],
          data: new Uint8Array([2]),
        });
        const listSpy = vi.spyOn(programClient, 'getListInstruction' as any);

        // Act
        const instr = await jobs.post({
          market: marketAddr,
          timeout,
          ipfsHash: ipfsCid,
          node: nodeAddr,
        });

        // Assert - verify behavior: post creates assign instruction when node is provided
        expect(assignSpy).toHaveBeenCalled();
        expect(listSpy).not.toHaveBeenCalled();
        const args = assignSpy.mock.calls[0][0] as any;
        expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
        expect(args.node).toBe(nodeAddr);
        expect(instr).toBeDefined();
      });
    });

    describe('work', () => {
      it('creates work instruction without NFT using NOS token ATA', async () => {
        // Test constants
        const walletAddr = newAddr(200);
        const marketAddr = newAddr(201);

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock client.getWorkInstruction (generated client - acceptable to mock)
        const workSpy = vi.spyOn(programClient, 'getWorkInstruction' as any).mockReturnValue({
          programAddress: newAddr(204),
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act
        const instr = await jobs.work({ market: marketAddr });

        // Assert - verify behavior: instruction is created with correct accounts
        expect(workSpy).toHaveBeenCalled();
        const args = workSpy.mock.calls[0][0] as any;
        expect(args.market).toBe(marketAddr);
        expect(args.metadata).toBe(SYSTEM_PROGRAM_ADDRESS); // Should use system program for metadata
        expect(args.nft).toBeDefined(); // Should use NOS ATA when no NFT provided (real implementation)
        expect(args.stake).toBeDefined(); // Stake PDA should be derived
        expect(args.payer).toBe(wallet);
        expect(args.authority).toBe(wallet);
        expect(args.run).toBeDefined(); // Run keypair should be generated
        expect(instr).toBeDefined();
      });

      it('creates work instruction with NFT using NFT ATA and metadata PDA', async () => {
        // Test constants
        const walletAddr = newAddr(210);
        const marketAddr = newAddr(211);
        const nftMint = newAddr(212);

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock client.getWorkInstruction (generated client - acceptable to mock)
        const workSpy = vi.spyOn(programClient, 'getWorkInstruction' as any).mockReturnValue({
          programAddress: newAddr(216),
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act
        const instr = await jobs.work({ market: marketAddr, nft: nftMint });

        // Assert - verify behavior: instruction is created with correct accounts
        expect(workSpy).toHaveBeenCalled();
        const args = workSpy.mock.calls[0][0] as any;
        expect(args.market).toBe(marketAddr);
        expect(args.nft).toBeDefined(); // Should use NFT ATA when NFT provided
        expect(args.metadata).toBeDefined(); // Should use metadata PDA when NFT provided
        expect(args.stake).toBeDefined(); // Stake PDA should be derived
        expect(args.payer).toBe(wallet);
        expect(args.authority).toBe(wallet);
        expect(args.run).toBeDefined(); // Run keypair should be generated
        expect(instr).toBeDefined();
      });
    });

    describe('finish', () => {
      it('creates finish instruction with decoded ipfsResult and returns tuple', async () => {
        // Test constants
        const walletAddr = newAddr(220);
        const jobAddr = newAddr(221);
        const nodeAddr = newAddr(223);
        const payerAddr = newAddr(224);
        const marketAddr = newAddr(225);
        const vaultPda = newAddr(226);
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
        const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

        // Arrange wallet
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;

        // Mock vault PDA to return a specific value
        (sdk as any).solana.pda = vi.fn(async () => vaultPda);

        // Mock job account with price > 0
        const jobAccount = makeJobAccount(JobState.RUNNING, jobAddr);
        jobAccount.data.market = marketAddr;
        jobAccount.data.payer = payerAddr;
        jobAccount.data.price = BigInt(100);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

        // Mock run account
        const runAccount = makeRunAccount(jobAddr, RUN_TIME_555, nodeAddr);
        runAccount.data.payer = payerAddr;
        vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([
            {
              pubkey: runAccount.address,
              account: {
                data: Buffer.from('mock-run-data').toString('base64'),
                executable: false,
                lamports: 1000000,
                owner: sdk.config.programs.jobsAddress,
                rentEpoch: 0,
              },
            },
          ]),
        })) as any;

        // Mock getCreateATAInstructionIfNeeded to return null (ATAs already exist)
        (sdk as any).solana.getCreateATAInstructionIfNeeded = vi.fn(async () => null);

        // Mock client.getFinishInstruction (generated client - acceptable to mock)
        const finishSpy = vi.spyOn(programClient, 'getFinishInstruction' as any).mockReturnValue({
          programAddress: newAddr(229),
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act
        const instructions = await jobs.finish({ job: jobAddr, ipfsResultsHash: ipfsCid });

        // Assert - verify behavior
        expect(finishSpy).toHaveBeenCalled();
        const args = finishSpy.mock.calls[0][0] as any;
        // Verify IPFS result is decoded correctly (32 bytes, not 34 with prefix)
        expect(Array.from(args.ipfsResult)).toEqual(ipfsBytes);
        expect(args.ipfsResult).toHaveLength(IPFS_BYTES_LENGTH);
        // Verify accounts are passed correctly
        expect(args.job).toBe(jobAddr);
        expect(args.run).toBe(runAccount.address);
        expect(args.market).toBe(marketAddr);
        expect(args.authority).toBe(wallet);
        // Verify deposit uses ATA when price > 0 (should be different from vault)
        expect(args.deposit).toBeDefined();
        expect(args.vault).toBe(vaultPda);
        // When price > 0, deposit should be the payer's ATA (from real findAssociatedTokenPda), not the vault
        // The real findAssociatedTokenPda will return a different value than the mocked vault PDA
        expect(args.deposit).not.toBe(args.vault);
        // Should return tuple with finish instruction (no ATA creation instructions since ATAs exist)
        expect(instructions).toHaveLength(1);
        expect(instructions[0]).toBeDefined();
      });
    });

    describe('complete', () => {
      it('creates complete instruction with decoded ipfsResult and correct accounts', async () => {
        // Test constants
        const walletAddr = newAddr(240);
        const jobAddr = newAddr(241);
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
        const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

        // Arrange wallet
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;

        // Mock job account with COMPLETED state and empty ipfsResult (all zeros = empty hash)
        const jobAccount = makeJobAccount(JobState.COMPLETED, jobAddr);
        jobAccount.data.ipfsResult = new Uint8Array(IPFS_BYTES_LENGTH).fill(0); // Empty result (will be converted to null)
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

        // Mock client.getCompleteInstruction (generated client - acceptable to mock)
        const completeSpy = vi
          .spyOn(programClient, 'getCompleteInstruction' as any)
          .mockReturnValue({
            programAddress: newAddr(242),
            accounts: [],
            data: new Uint8Array([1]),
          });

        // Act
        const instruction = await jobs.complete({ job: jobAddr, ipfsResultsHash: ipfsCid });

        // Assert - verify behavior
        expect(completeSpy).toHaveBeenCalled();
        const args = completeSpy.mock.calls[0][0] as any;
        // Verify IPFS result is decoded correctly (32 bytes, not 34 with prefix)
        expect(Array.from(args.ipfsResult)).toEqual(ipfsBytes);
        expect(args.ipfsResult).toHaveLength(IPFS_BYTES_LENGTH);
        // Verify accounts are passed correctly
        expect(args.job).toBe(jobAddr);
        expect(args.authority).toBe(wallet);
        expect(instruction).toBeDefined();
      });
    });

    describe('quit', () => {
      it('creates quit instruction with correct accounts from run', async () => {
        // Test constants
        const walletAddr = newAddr(250);
        const runAddr = newAddr(251);
        const jobAddr = newAddr(252);
        const payerAddr = newAddr(253);

        // Arrange wallet
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;

        // Mock run account
        const runAccount = RunAccountFactory.create({
          address: runAddr,
          job: jobAddr,
          payer: payerAddr,
          time: BigInt(RUN_TIME_555),
        });
        vi.spyOn(programClient, 'fetchRunAccount' as any).mockResolvedValue(runAccount);

        // Mock client.getQuitInstruction (generated client - acceptable to mock)
        const quitSpy = vi.spyOn(programClient, 'getQuitInstruction' as any).mockReturnValue({
          programAddress: newAddr(254),
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act
        const instruction = await jobs.quit({ run: runAddr });

        // Assert - verify behavior
        expect(quitSpy).toHaveBeenCalled();
        const args = quitSpy.mock.calls[0][0] as any;
        // Verify accounts are passed correctly
        expect(args.job).toBe(jobAddr);
        expect(args.run).toBe(runAddr);
        expect(args.payer).toBe(payerAddr);
        expect(args.authority).toBe(wallet);
        expect(instruction).toBeDefined();
      });
    });

    describe('stop', () => {
      it('creates stop instruction with market and node (defaults to wallet)', async () => {
        // Test constants
        const walletAddr = newAddr(260);
        const marketAddr = newAddr(261);

        // Arrange wallet
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;

        // Mock client.getStopInstruction (generated client - acceptable to mock)
        const stopSpy = vi.spyOn(programClient, 'getStopInstruction' as any).mockReturnValue({
          programAddress: newAddr(262),
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act - without node (should default to wallet)
        const instruction = await jobs.stop({ market: marketAddr });

        // Assert - verify behavior
        expect(stopSpy).toHaveBeenCalled();
        const args = stopSpy.mock.calls[0][0] as any;
        expect(args.market).toBe(marketAddr);
        expect(args.node).toBe(walletAddr); // Should default to wallet address
        expect(args.authority).toBe(wallet);
        expect(instruction).toBeDefined();
      });

      it('creates stop instruction with market and provided node', async () => {
        // Test constants
        const walletAddr = newAddr(270);
        const marketAddr = newAddr(271);
        const nodeAddr = newAddr(272);

        // Arrange wallet
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;

        // Mock client.getStopInstruction (generated client - acceptable to mock)
        const stopSpy = vi.spyOn(programClient, 'getStopInstruction' as any).mockReturnValue({
          programAddress: newAddr(273),
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act - with node provided
        const instruction = await jobs.stop({ market: marketAddr, node: nodeAddr });

        // Assert - verify behavior
        expect(stopSpy).toHaveBeenCalled();
        const args = stopSpy.mock.calls[0][0] as any;
        expect(args.market).toBe(marketAddr);
        expect(args.node).toBe(nodeAddr); // Should use provided node
        expect(args.authority).toBe(wallet);
        expect(instruction).toBeDefined();
      });
    });

    describe('error handling', () => {
      it.each([
        {
          method: 'get' as const,
          mockFn: 'fetchJobAccount',
          description: 'get',
        },
        {
          method: 'run' as const,
          mockFn: 'fetchRunAccount',
          description: 'run',
        },
        {
          method: 'market' as const,
          mockFn: 'fetchMarketAccount',
          description: 'market',
        },
      ])('$description propagates fetch errors', async ({ method, mockFn }) => {
        const testAddr = newAddr(90);
        const rpcError = new Error('RPC error');
        vi.spyOn(programClient, mockFn as any).mockRejectedValue(rpcError);
        await expect(jobs[method](testAddr)).rejects.toThrow('RPC error');
      });

      it('all propagates getProgramAccounts errors', async () => {
        const ctx = MockClientFactory.createMockWithRpc();
        sdk = ctx.sdk;
        jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);
        const networkError = new Error('Network error');
        (sdk as any).solana.rpc.getProgramAccounts = vi
          .fn()
          .mockReturnValue({ send: vi.fn().mockRejectedValue(networkError) });
        await expect(jobs.all()).rejects.toThrow('Network error');
      });
    });
  });

  describe('monitor', () => {
    let sdk: ReturnType<typeof makeMonitorSdk>;
    let jobs: JobsProgram;
    let stop: (() => void) | undefined;
    const JOB_ADDR = newAddr(100);
    const MARKET_ADDR = newAddr(101);
    const RUN_ADDR = newAddr(102);
    const NODE_ADDR = newAddr(103);

    beforeEach(() => {
      sdk = makeMonitorSdk();
      jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);
      stop = undefined;
    });

    afterEach(() => {
      if (stop) {
        stop();
      }
    });

    const createMockSubscription = (notifications: any[]) => {
      let index = 0;
      const mockIterable = {
        [Symbol.asyncIterator]() {
          return {
            async next() {
              if (index < notifications.length) {
                return { done: false, value: notifications[index++] };
              }
              return { done: true, value: undefined };
            },
            return: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          };
        },
      };
      const mockSubscribe = vi.fn().mockResolvedValue(mockIterable);
      const mockProgramNotifications = vi.fn().mockReturnValue({ subscribe: mockSubscribe });
      (sdk as any).solana.rpcSubscriptions = {
        programNotifications: mockProgramNotifications,
      };
      return mockIterable;
    };

    const createNotification = (pubkey: Address, accountType: string) => ({
      value: {
        account: {
          data: Buffer.from(`mock-${accountType}-data`).toString('base64'),
          executable: false,
          lamports: 1000000,
          owner: sdk.config.programs.jobsAddress,
          space: BigInt(accountType === MonitorEventType.RUN ? 113 : 233),
        },
        pubkey,
      },
    });

    it('returns event stream and stop function', async () => {
      createMockSubscription([]);
      const [eventStream, stopFn] = await jobs.monitor();

      expect(eventStream).toBeDefined();
      expect(stopFn).toBeInstanceOf(Function);
      expect(typeof eventStream[Symbol.asyncIterator]).toBe('function');

      stop = stopFn;
    });

    it('yields job and market events without run events', async () => {
      const jobAccount = makeJobAccount(JobState.QUEUED, JOB_ADDR);
      const marketAccount = makeMarketAccount();
      const notifications = [
        createNotification(JOB_ADDR, MonitorEventType.JOB),
        createNotification(MARKET_ADDR, MonitorEventType.MARKET),
      ];

      createMockSubscription(notifications);
      vi.spyOn(programClient, 'decodeJobAccount' as any).mockReturnValue(jobAccount);
      vi.spyOn(programClient, 'decodeMarketAccount' as any).mockReturnValue(marketAccount);
      vi.spyOn(programClient, 'identifyNosanaJobsAccount' as any).mockImplementation(
        (account: any) => {
          if (account.address === JOB_ADDR) return programClient.NosanaJobsAccount.JobAccount;
          if (account.address === MARKET_ADDR) return programClient.NosanaJobsAccount.MarketAccount;
          return null;
        }
      );
      sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
        send: vi.fn().mockResolvedValue([]),
      })) as any;

      const [eventStream, stopFn] = await jobs.monitor();
      stop = stopFn;
      const events: any[] = [];
      for await (const event of eventStream) {
        events.push(event);
        if (events.length >= 2) break;
      }

      expect(events).toHaveLength(2);
      expect(events[0].type).toBe(MonitorEventType.JOB);
      expect(events[1].type).toBe(MonitorEventType.MARKET);
      expect(events.every((e) => e.type !== MonitorEventType.RUN)).toBe(true);
    });

    it('auto-merges run accounts into job events', async () => {
      const jobAccount = makeJobAccount(JobState.QUEUED, JOB_ADDR);
      const runAccount = makeRunAccount(JOB_ADDR, RUN_TIME_555, NODE_ADDR);
      const notifications = [createNotification(RUN_ADDR, MonitorEventType.RUN)];

      createMockSubscription(notifications);
      vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
      vi.spyOn(programClient, 'decodeJobAccount' as any).mockReturnValue(jobAccount);
      vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);
      vi.spyOn(programClient, 'identifyNosanaJobsAccount' as any).mockReturnValue(
        programClient.NosanaJobsAccount.RunAccount
      );

      const [eventStream, stopFn] = await jobs.monitor();
      stop = stopFn;
      const events: any[] = [];
      for await (const event of eventStream) {
        events.push(event);
        break;
      }

      expect(events).toHaveLength(1);
      const event = events[0];
      expect(event.type).toBe(MonitorEventType.JOB);
      expect(event.data.state).toBe(JobState.RUNNING);
      expect(event.data.timeStart).toBe(RUN_TIME_555);
      expect(event.data.node).toBe(NODE_ADDR);
    });

    it('monitorDetailed yields run events separately', async () => {
      const runAccount = makeRunAccount(JOB_ADDR, RUN_TIME_777);
      const notifications = [createNotification(RUN_ADDR, MonitorEventType.RUN)];

      createMockSubscription(notifications);
      vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
      vi.spyOn(programClient, 'identifyNosanaJobsAccount' as any).mockReturnValue(
        programClient.NosanaJobsAccount.RunAccount
      );

      const [eventStream, stopFn] = await jobs.monitorDetailed();
      stop = stopFn;
      const events: any[] = [];
      for await (const event of eventStream) {
        events.push(event);
        break;
      }

      expect(events).toHaveLength(1);
      const event = events[0];
      expect(event.type).toBe(MonitorEventType.RUN);
      expect(event.data.time).toBe(RUN_TIME_777);
      expect(event.data.job).toBe(JOB_ADDR);
    });
  });
});
