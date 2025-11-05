import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobsProgram, JobState, MarketQueueType } from '../src/programs/JobsProgram.js';
import * as programClient from '../src/generated_clients/jobs/index.js';
import { address, type Address, type Account } from 'gill';
import bs58 from 'bs58';
import type { NosanaClient } from '../src/index.js';

vi.mock('@solana-program/token', () => ({
  findAssociatedTokenPda: vi.fn(async () => ['ata']),
  TOKEN_PROGRAM_ADDRESS: 'TokenProg',
}));

// Shared helpers
function baseSdk(): NosanaClient {
  const valid = '11111111111111111111111111111111';
  const sdk = {
    config: {
      programs: {
        jobsAddress: address(valid),
        nosTokenAddress: address(valid),
        rewardsAddress: address(valid),
      },
    },
    logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
    solana: { rpc: {} },
  } as unknown as NosanaClient;
  return sdk;
}

function newAddr(seed = 0): Address {
  const bytes = new Uint8Array(32);
  bytes[31] = seed;
  return address(bs58.encode(bytes));
}

function jobAccount(state: number, addr: Address = newAddr(4)): Account<programClient.JobAccount> {
  const ipfsBytes = new Uint8Array(32).map((_, i) => i);
  return {
    address: addr,
    data: {
      discriminator: new Uint8Array(8),
      ipfsJob: ipfsBytes,
      ipfsResult: ipfsBytes,
      market: newAddr(20), node: newAddr(21), payer: newAddr(22),
      price: BigInt(1), project: newAddr(23), state,
      timeEnd: BigInt(0), timeStart: BigInt(0), timeout: BigInt(0),
    },
  } as any;
}

function runAccount(job: Address, time: number, node?: Address): Account<programClient.RunAccount> {
  return {
    address: newAddr(5),
    data: {
      discriminator: new Uint8Array(8),
      job, node: node ?? newAddr(6), payer: newAddr(7), state: 0, time: BigInt(time),
    },
  } as any;
}

function marketAccount(): Account<programClient.MarketAccount> {
  const addr = newAddr(8);
  return {
    address: addr,
    data: {
      discriminator: new Uint8Array(8),
      project: addr,
      nodeAccessKey: addr,
      nodeXnosMinimum: BigInt(5),
      jobPrice: BigInt(10),
      jobTimeout: BigInt(200),
      jobType: BigInt(1),
      vault: addr,
      queueType: 1, // NODE_QUEUE
    },
  } as any;
}

describe('JobsProgram', () => {
  describe('transforms', () => {
    let jobs: JobsProgram;

    beforeEach(() => {
      jobs = new JobsProgram(baseSdk());
    });

    it('transformJobAccount converts bigint and ipfs bytes and casts state', () => {
      const acc = jobAccount(JobState.COMPLETED, newAddr(9));
      const out = jobs.transformJobAccount(acc);
      expect(out.address).toBe(acc.address);
      expect(out.price).toBe(1);
      expect(out.timeStart).toBe(0);
      expect(out.timeEnd).toBe(0);
      expect(out.timeout).toBe(0);
      expect(out.state).toBe(JobState.COMPLETED);
      expect(typeof out.ipfsJob).toBe('string');
      expect((out.ipfsJob as string).length).toBeGreaterThan(40);
    });

    it('transformRunAccount converts fields to number', () => {
      const acc = runAccount(newAddr(10), 999);
      const out = jobs.transformRunAccount(acc);
      expect(out.address).toBe(acc.address);
      expect(out.time).toBe(999);
    });

    it('transformMarketAccount casts queueType and converts numbers', () => {
      const acc = marketAccount();
      const out = jobs.transformMarketAccount(acc);
      expect(out.address).toBe(acc.address);
      expect(out.jobPrice).toBe(10);
      expect(out.jobTimeout).toBe(200);
      expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
    });
  });

  describe('methods', () => {
    function makeSdkRpc() {
      const sentArgs: any[] = [];
      const rpc = {
        getProgramAccounts: vi.fn((_pid: Address, args: any) => ({
          send: vi.fn(async () => { sentArgs.push(args); return []; }),
        })),
      };
      const sdk = {
        config: { programs: { jobsAddress: newAddr(1), nosTokenAddress: newAddr(2), rewardsAddress: newAddr(3) } },
        logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
        solana: { rpc },
      } as unknown as NosanaClient & { solana: { rpc: any } };
      return { sdk, sentArgs };
    }

    let sdk: NosanaClient;
    let jobs: JobsProgram;

    beforeEach(() => {
      const ctx = makeSdkRpc();
      sdk = ctx.sdk; jobs = new JobsProgram(sdk);
    });

    describe('get, run, market', () => {
      it('run fetches and transforms single run account', async () => {
        const addr = newAddr(100);
        vi.spyOn(programClient, 'fetchRunAccount' as any).mockResolvedValue(runAccount(addr, 888));
        const out = await jobs.run(addr);
        expect(out.address).toBeDefined();
        expect(out.time).toBe(888);
      });

      it('market fetches and transforms single market account', async () => {
        const addr = newAddr(101);
        vi.spyOn(programClient, 'fetchMarketAccount' as any).mockResolvedValue(marketAccount());
        const out = await jobs.market(addr);
        expect(out.address).toBeDefined();
        expect(out.jobPrice).toBe(10);
        expect(out.queueType).toBe(MarketQueueType.NODE_QUEUE);
      });
    });

    describe('get and multiple (checkRuns)', () => {
      it('get does not call runs when checkRun is false', async () => {
        const addr = newAddr(60);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount(JobState.QUEUED, addr));
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([] as any);
        const out = await jobs.get(addr, false);
        expect(runsSpy).not.toHaveBeenCalled();
        expect(out.state).toBe(JobState.QUEUED);
      });

      it('get leaves non-queued jobs unchanged', async () => {
        const addr = newAddr(61);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount(JobState.COMPLETED, addr));
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([] as any);
        const out = await jobs.get(addr, true);
        expect(runsSpy).not.toHaveBeenCalled();
        expect(out.state).toBe(JobState.COMPLETED);
      });

      it('multiple does not call runs when checkRuns is false', async () => {
        const a = newAddr(62);
        const b = newAddr(63);
        vi.spyOn(programClient, 'fetchAllJobAccount' as any).mockResolvedValue([jobAccount(JobState.QUEUED, a), jobAccount(JobState.QUEUED, b)]);
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([] as any);
        const out = await jobs.multiple([a, b], false);
        expect(runsSpy).not.toHaveBeenCalled();
        expect(out.every(j => j.state === JobState.QUEUED)).toBe(true);
      });
      it('get sets RUNNING and timeStart when checkRun is true and a run exists', async () => {
        const addr = newAddr(10);
        vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount(JobState.QUEUED, addr));
        const runsSpy = vi.spyOn(jobs, 'runs').mockResolvedValue([{ address: newAddr(25), job: addr, node: newAddr(26), time: 555 }] as any);

        const out = await jobs.get(addr, true);
        expect(runsSpy).toHaveBeenCalledWith({ job: addr });
        expect(out.state).toBe(JobState.RUNNING);
        expect(out.timeStart).toBe(555);
      });

      it('multiple applies runs mapping only to queued jobs when checkRuns is true', async () => {
        const a = newAddr(11);
        const b = newAddr(12);
        vi.spyOn(programClient, 'fetchAllJobAccount' as any).mockResolvedValue([jobAccount(JobState.QUEUED, a), jobAccount(JobState.COMPLETED, b)]);
        vi.spyOn(jobs, 'runs').mockResolvedValue([{ address: newAddr(30), job: a, node: newAddr(31), time: 777 }] as any);

        const out = await jobs.multiple([a, b], true);
        const first = out.find(j => j.address === a)!;
        const second = out.find(j => j.address === b)!;
        expect(first.state).toBe(JobState.RUNNING);
        expect(first.timeStart).toBe(777);
        expect(second.state).toBe(JobState.COMPLETED);
      });
    });

    describe('GPA filters', () => {
      it('all() builds discriminator and expected offset filters', async () => {
        const ctx = makeSdkRpc();
        sdk = ctx.sdk; jobs = new JobsProgram(sdk);
        const filters = { state: JobState.RUNNING, project: newAddr(40), node: newAddr(41), market: newAddr(42) } as any;
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
        const ctx = makeSdkRpc(); sdk = ctx.sdk; jobs = new JobsProgram(sdk);
        await jobs.runs({ job: newAddr(50), node: newAddr(51) });
        const call = (sdk as any).solana.rpc.getProgramAccounts.mock.calls[0][1];
        const memcmps = call.filters.map((f: any) => f.memcmp).filter(Boolean);
        expect(memcmps[0].offset).toBe(0n);
      });

      it('markets() includes MARKET discriminator (offset 0)', async () => {
        const ctx = makeSdkRpc(); sdk = ctx.sdk; jobs = new JobsProgram(sdk);
        await jobs.markets();
        const call = (sdk as any).solana.rpc.getProgramAccounts.mock.calls[0][1];
        const memcmps = call.filters.map((f: any) => f.memcmp).filter(Boolean);
        expect(memcmps[0].offset).toBe(0n);
      });
    });

    describe('post', () => {
      it('creates list instruction with decoded ipfsJob and PDAs', async () => {
        // Arrange wallet and mocks
        const wallet = { address: newAddr(70), signMessages: async () => [], signTransactions: async () => [] } as any;
        (sdk as any).wallet = wallet;
        // mock PDA helper used for vault
        (sdk as any).solana.pda = vi.fn(async () => newAddr(80));
        // mock ATA PDA
        const token = await import('@solana-program/token');
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([newAddr(72)]);
        // spy on client.getListInstruction
        const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({ programAddress: newAddr(73), accounts: [], data: new Uint8Array([1]) });

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
  });
});


