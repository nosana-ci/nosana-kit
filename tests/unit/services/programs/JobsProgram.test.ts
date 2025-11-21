import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createJobsProgram,
  type JobsProgram,
  JobState,
  MarketQueueType,
} from '../../../../src/services/programs/JobsProgram.js';
import * as programClient from '../../../../src/generated_clients/jobs/index.js';
import { type Address } from '@solana/kit';
import {
  AddressFactory,
  MockClientFactory,
  JobAccountFactory,
  RunAccountFactory,
  MarketAccountFactory,
  sdkToProgramDeps,
} from '../../helpers/index.js';

vi.mock('@solana-program/token', () => ({
  findAssociatedTokenPda: vi.fn(async () => ['ata']),
  TOKEN_PROGRAM_ADDRESS: 'TokenProg',
}));

// Test constants
const TEST_TIMEOUT = 10;
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

    describe('post', () => {
      it('creates list instruction with decoded ipfsJob and PDAs', async () => {
        // Test constants
        const walletAddr = newAddr(70);
        const vaultPda = newAddr(80);
        const ataPda = newAddr(72);
        const programAddr = newAddr(73);
        const marketAddr = newAddr(74);
        const timeout = 1000;
        const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
        const ipfsCid = (await import('../../../../src/ipfs/IPFS.js')).IPFS.solHashToIpfsHash(
          ipfsBytes
        )!;

        // Arrange wallet and mocks
        const wallet = {
          address: walletAddr,
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // Mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => vaultPda);
        // Mock ATA PDA
        const token = await import('@solana-program/token');
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([ataPda]);
        // Mock client.getListInstruction (generated client - acceptable to mock)
        const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
          programAddress: programAddr,
          accounts: [],
          data: new Uint8Array([1]),
        });

        // Act
        const instr = await jobs.post({ market: marketAddr, timeout, ipfsHash: ipfsCid });

        // Assert - verify behavior: instruction is created with correct IPFS bytes
        expect(listSpy).toHaveBeenCalled();
        const args = listSpy.mock.calls[0][0] as any;
        expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
        expect(instr).toBeDefined();
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
    it('returns a stop function and sets up program notifications subscription', async () => {
      const sdk = makeMonitorSdk();
      const jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);

      // Mock WebSocket subscription with immediate completion
      const mockIterable = {
        [Symbol.asyncIterator]() {
          return {
            next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
            return: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          };
        },
      };

      const mockSubscribe = vi.fn().mockResolvedValue(mockIterable);
      const mockProgramNotifications = vi.fn().mockReturnValue({ subscribe: mockSubscribe });

      (sdk as any).solana.rpcSubscriptions = {
        programNotifications: mockProgramNotifications,
      };

      const stopMonitoring = await jobs.monitor();

      expect(stopMonitoring).toBeInstanceOf(Function);
      expect(mockProgramNotifications).toHaveBeenCalledWith(sdk.config.programs.jobsAddress, {
        encoding: 'base64',
      });

      // Stop monitoring to clean up
      stopMonitoring();
      await new Promise((resolve) => setTimeout(resolve, TEST_TIMEOUT));
    });

    it('accepts callback options for job, market, run accounts, and error handling', async () => {
      const sdk = makeMonitorSdk();
      const jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);

      const onJobAccount = vi.fn();
      const onMarketAccount = vi.fn();
      const onRunAccount = vi.fn();
      const onError = vi.fn();

      const mockIterable = {
        [Symbol.asyncIterator]() {
          return {
            next: vi.fn().mockResolvedValue({ done: true, value: undefined }),
            return: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          };
        },
      };

      const mockSubscribe = vi.fn().mockResolvedValue(mockIterable);
      const mockProgramNotifications = vi.fn().mockReturnValue({ subscribe: mockSubscribe });

      (sdk as any).solana.rpcSubscriptions = {
        programNotifications: mockProgramNotifications,
      };

      const stopMonitoring = await jobs.monitor({
        onJobAccount,
        onMarketAccount,
        onRunAccount,
        onError,
      });

      expect(stopMonitoring).toBeInstanceOf(Function);

      stopMonitoring();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it('handles subscription setup errors gracefully', async () => {
      const sdk = makeMonitorSdk();
      const jobs = createJobsProgram(sdkToProgramDeps(sdk), sdk.config.programs);

      // Mock subscription to throw error
      const mockSubscribe = vi.fn().mockRejectedValue(new Error('Subscription failed'));
      const mockProgramNotifications = vi.fn().mockReturnValue({ subscribe: mockSubscribe });

      (sdk as any).solana.rpcSubscriptions = {
        programNotifications: mockProgramNotifications,
      };

      // Should not throw immediately since error handling is internal with retry logic
      const stopMonitoring = await jobs.monitor();

      expect(stopMonitoring).toBeInstanceOf(Function);

      stopMonitoring();
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });
});
