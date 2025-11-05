import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsProgram, JobState, MarketQueueType } from '../src/programs/JobsProgram.js';
import * as programClient from '../src/generated_clients/jobs/index.js';
import { type Address } from 'gill';
import {
  AddressFactory,
  SdkFactory,
  JobAccountFactory,
  RunAccountFactory,
  MarketAccountFactory,
} from './helpers/index.js';

vi.mock('@solana-program/token', () => ({
  findAssociatedTokenPda: vi.fn(async () => ['ata']),
  TOKEN_PROGRAM_ADDRESS: 'TokenProg',
}));

// Legacy aliases for backward compatibility (to be gradually replaced)
const baseSdk = () => SdkFactory.createBasic();
const newAddr = (seed?: number) => AddressFactory.create(seed);
const makeJobAccount = (state: number, addr?: Address) =>
  JobAccountFactory.create({ state, address: addr });
const makeRunAccount = (job: Address, time: number, node?: Address) =>
  RunAccountFactory.create({ job, time: BigInt(time), node });
const makeMarketAccount = () => MarketAccountFactory.create();
const makeMonitorSdk = () => SdkFactory.createWithSubscriptions();

describe('JobsProgram', () => {
  describe('transforms', () => {
    let jobs: JobsProgram;

    beforeEach(() => {
      jobs = new JobsProgram(baseSdk());
    });

    it('transformJobAccount converts bigint and ipfs bytes and casts state', () => {
      const acc = makeJobAccount(JobState.COMPLETED, newAddr(9));
      const out = jobs.transformJobAccount(acc);
      expect(out.address).toBe(acc.address);
      expect(out.price).toBe(1);
      expect(out.timeStart).toBe(0);
      expect(out.timeEnd).toBe(0);
      expect(out.timeout).toBe(0);
      expect(out.state).toBe(JobState.COMPLETED);
      expect(out.ipfsJob).toBeTypeOf('string');
      expect((out.ipfsJob as string).length).toBeGreaterThan(40);
    });

    it('transformRunAccount converts fields to number', () => {
      const acc = makeRunAccount(newAddr(10), 999);
      const out = jobs.transformRunAccount(acc);
      expect(out.address).toBe(acc.address);
      expect(out.time).toBe(999);
    });

    it('transformMarketAccount casts queueType and converts numbers', () => {
      const acc = makeMarketAccount();
      const out = jobs.transformMarketAccount(acc);
      expect(out.address).toBe(acc.address);
      expect(out.jobPrice).toBe(10);
      expect(out.jobTimeout).toBe(200);
      expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
    });
  });

  describe('methods', () => {
    let sdk: ReturnType<typeof SdkFactory.createWithRpc>['sdk'];
    let jobs: JobsProgram;

    beforeEach(() => {
      const ctx = SdkFactory.createWithRpc();
      sdk = ctx.sdk;
      jobs = new JobsProgram(sdk);
    });

    describe('get, run, market', () => {
      it('run fetches and transforms single run account', async () => {
        const addr = newAddr(100);
        vi.spyOn(programClient, 'fetchRunAccount' as any).mockResolvedValue(
          makeRunAccount(addr, 888)
        );
        const out = await jobs.run(addr);
        expect(out.address).toBeDefined();
        expect(out.time).toBe(888);
      });

      it('market fetches and transforms single market account', async () => {
        const addr = newAddr(101);
        vi.spyOn(programClient, 'fetchMarketAccount' as any).mockResolvedValue(makeMarketAccount());
        const out = await jobs.market(addr);
        expect(out.address).toBeDefined();
        expect(out.jobPrice).toBe(10);
        expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
      });
    });

    describe('get and multiple (checkRuns)', () => {
      it('get does not call runs when checkRun is false', async () => {
        const addr = newAddr(60);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(
          makeJobAccount(JobState.QUEUED, addr)
        );
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([] as any);
        const out = await jobs.get(addr, false);
        expect(runsSpy).not.toHaveBeenCalled();
        expect(out.state).toBe(JobState.QUEUED);
      });

      it('get leaves non-queued jobs unchanged', async () => {
        const addr = newAddr(61);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(
          makeJobAccount(JobState.COMPLETED, addr)
        );
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([] as any);
        const out = await jobs.get(addr, true);
        expect(runsSpy).not.toHaveBeenCalled();
        expect(out.state).toBe(JobState.COMPLETED);
      });

      it('multiple does not call runs when checkRuns is false', async () => {
        const a = newAddr(62);
        const b = newAddr(63);
        vi.spyOn(programClient, 'fetchAllJobAccount' as any).mockResolvedValue([
          makeJobAccount(JobState.QUEUED, a),
          makeJobAccount(JobState.QUEUED, b),
        ]);
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([] as any);
        const out = await jobs.multiple([a, b], false);
        expect(runsSpy).not.toHaveBeenCalled();
        expect(out.every((j) => j.state === JobState.QUEUED)).toBe(true);
        expect(out).toHaveLength(2);
      });
      it('get sets RUNNING and timeStart when checkRun is true and a run exists', async () => {
        const addr = newAddr(10);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(
          makeJobAccount(JobState.QUEUED, addr)
        );
        const runsSpy = vi
          .spyOn(jobs, 'runs')
          .mockResolvedValue([
            { address: newAddr(25), job: addr, node: newAddr(26), time: 555 },
          ] as any);

        const out = await jobs.get(addr, true);
        expect(runsSpy).toHaveBeenCalledWith({ job: addr });
        expect(out.state).toBe(JobState.RUNNING);
        expect(out.timeStart).toBe(555);
      });

      it('multiple applies runs mapping only to queued jobs when checkRuns is true', async () => {
        const a = newAddr(11);
        const b = newAddr(12);
        vi.spyOn(programClient, 'fetchAllJobAccount' as any).mockResolvedValue([
          makeJobAccount(JobState.QUEUED, a),
          makeJobAccount(JobState.COMPLETED, b),
        ]);
        vi.spyOn(jobs, 'runs').mockResolvedValue([
          { address: newAddr(30), job: a, node: newAddr(31), time: 777 },
        ] as any);

        const out = await jobs.multiple([a, b], true);
        const first = out.find((j) => j.address === a)!;
        const second = out.find((j) => j.address === b)!;
        expect(first.state).toBe(JobState.RUNNING);
        expect(first.timeStart).toBe(777);
        expect(second.state).toBe(JobState.COMPLETED);
      });
    });

    describe('GPA filters', () => {
      it('all() builds discriminator and expected offset filters', async () => {
        const ctx = SdkFactory.createWithRpc();
        sdk = ctx.sdk;
        jobs = new JobsProgram(sdk);
        const filters = {
          state: JobState.RUNNING,
          project: newAddr(40),
          node: newAddr(41),
          market: newAddr(42),
        } as any;
        await jobs.all(filters);
        const call = (sdk as any).solana.rpc.getProgramAccounts.mock.calls[0][1];
        const memcmps = call.filters.map((f: any) => f.memcmp).filter(Boolean);
        expect(memcmps[0].offset).toBe(0n);
        const byOffset = new Map(memcmps.map((m: any) => [m.offset.toString(), m]));
        expect(byOffset.get('208')).toBeTruthy();
        expect(byOffset.get('176')).toBeTruthy();
        expect(byOffset.get('104')).toBeTruthy();
        expect(byOffset.get('72')).toBeTruthy();
      });

      it('runs() includes RUN discriminator (offset 0)', async () => {
        const ctx = SdkFactory.createWithRpc();
        sdk = ctx.sdk;
        jobs = new JobsProgram(sdk);
        await jobs.runs({ job: newAddr(50), node: newAddr(51) });
        const call = (sdk as any).solana.rpc.getProgramAccounts.mock.calls[0][1];
        const memcmps = call.filters.map((f: any) => f.memcmp).filter(Boolean);
        expect(memcmps[0].offset).toBe(0n);
      });

      it('markets() includes MARKET discriminator (offset 0)', async () => {
        const ctx = SdkFactory.createWithRpc();
        sdk = ctx.sdk;
        jobs = new JobsProgram(sdk);
        await jobs.markets();
        const call = (sdk as any).solana.rpc.getProgramAccounts.mock.calls[0][1];
        const memcmps = call.filters.map((f: any) => f.memcmp).filter(Boolean);
        expect(memcmps[0].offset).toBe(0n);
      });
    });

    describe('post', () => {
      it('creates list instruction with decoded ipfsJob and PDAs', async () => {
        // Arrange wallet and mocks
        const wallet = {
          address: newAddr(70),
          signMessages: async () => [],
          signTransactions: async () => [],
        } as any;
        (sdk as any).wallet = wallet;
        // mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => newAddr(80));
        // mock ATA PDA
        const token = await import('@solana-program/token');
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([newAddr(72)]);
        // spy on client.getListInstruction
        const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
          programAddress: newAddr(73),
          accounts: [],
          data: new Uint8Array([1]),
        });

        const ipfsBytes = Array.from({ length: 32 }, (_, i) => i);
        const ipfsCid = (await import('../src/ipfs/IPFS.js')).IPFS.solHashToIpfsHash(ipfsBytes)!;

        // Act
        const instr = await jobs.post({ market: newAddr(74), timeout: 1000, ipfsHash: ipfsCid });

        // Assert
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
        vi.spyOn(programClient, mockFn as any).mockRejectedValue(new Error('RPC error'));
        await expect(jobs[method](newAddr(90))).rejects.toThrow('RPC error');
      });

      it('all propagates getProgramAccounts errors', async () => {
        const ctx = SdkFactory.createWithRpc();
        sdk = ctx.sdk;
        jobs = new JobsProgram(sdk);
        (sdk as any).solana.rpc.getProgramAccounts = vi
          .fn()
          .mockReturnValue({ send: vi.fn().mockRejectedValue(new Error('Network error')) });
        await expect(jobs.all()).rejects.toThrow('Network error');
      });
    });
  });

  describe('monitor', () => {
    it('returns a stop function and sets up program notifications subscription', async () => {
      const sdk = makeMonitorSdk();
      const jobs = new JobsProgram(sdk);

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
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    it('accepts callback options for job, market, run accounts, and error handling', async () => {
      const sdk = makeMonitorSdk();
      const jobs = new JobsProgram(sdk);

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
      const jobs = new JobsProgram(sdk);

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
