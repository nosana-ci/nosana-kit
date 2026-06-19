import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Instruction, AccountRole, address } from '@solana/kit';
import bs58 from 'bs58';
import {
  getDelistInstructionDataEncoder,
  getListInstructionDataEncoder,
} from '@nosana/jobs-program';

import { createJobsProgram } from '../../../../../src/services/programs/jobs/index.js';
import { MockClientFactory, sdkToProgramDeps } from '../../../setup/index.js';
import type { ProgramDeps } from '../../../../../src/types.js';

// A valid 32-byte address derived from a seed.
function addr(seed: number) {
  const buf = new Uint8Array(32);
  buf[0] = 100 + seed;
  buf[31] = seed;
  return address(bs58.encode(buf));
}

// Build a real, decodable list instruction whose `job` account is `jobAddr`.
function makeListInstruction(jobAddr: ReturnType<typeof addr>): Instruction {
  const accounts = Array.from({ length: 12 }, (_, i) => ({
    address: i === 0 ? jobAddr : addr(200 + i),
    role: AccountRole.READONLY,
  }));
  const data = getListInstructionDataEncoder().encode({ ipfsJob: new Uint8Array(32), timeout: 0 });
  return { programAddress: addr(0), accounts, data };
}

// Build a real, decodable delist instruction whose `job` account is `jobAddr`.
function makeDelistInstruction(jobAddr: ReturnType<typeof addr>): Instruction {
  const accounts = Array.from({ length: 7 }, (_, i) => ({
    address: i === 0 ? jobAddr : addr(200 + i),
    role: AccountRole.READONLY,
  }));
  return { programAddress: addr(0), accounts, data: getDelistInstructionDataEncoder().encode({}) };
}

// Stub deps.solana.buildSignAndSendBatch to return one fulfilled tx of `instructions`.
function stubBatch(deps: ProgramDeps, instructions: Instruction[]) {
  (deps.solana as unknown as { buildSignAndSendBatch: unknown }).buildSignAndSendBatch = vi
    .fn()
    .mockResolvedValue([
      {
        status: 'fulfilled',
        confirmed: true,
        signature: 'sig',
        instructions,
        groupIndices: instructions.map((_, i) => i),
      },
    ]);
}

describe('JobsProgram', () => {
  let deps: ProgramDeps;
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];
  let jobs: ReturnType<typeof createJobsProgram>;

  beforeEach(() => {
    const sdk = MockClientFactory.createBasic();
    deps = sdkToProgramDeps(sdk);
    config = sdk.config;
    jobs = createJobsProgram(deps, config.programs);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listMany', () => {
    it('builds `count` list instructions from one set of params', async () => {
      const spy = vi.spyOn(jobs, 'list').mockResolvedValue(makeListInstruction(addr(1)));
      const params = { market: addr(2), timeout: 3600, ipfsHash: 'hash' };

      const instructions = await jobs.listMany(params, 3);

      expect(instructions).toHaveLength(3);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(params);
    });

    it('builds one list instruction per element when given an array', async () => {
      const spy = vi.spyOn(jobs, 'list').mockResolvedValue(makeListInstruction(addr(1)));
      const params = [
        { market: addr(2), timeout: 1, ipfsHash: 'a' },
        { market: addr(2), timeout: 2, ipfsHash: 'b' },
      ];

      const instructions = await jobs.listMany(params);

      expect(instructions).toHaveLength(2);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, params[0]);
      expect(spy).toHaveBeenNthCalledWith(2, params[1]);
    });
  });

  describe('account-array bulk builders', () => {
    it('delistMany builds one delist per job address', async () => {
      const spy = vi.spyOn(jobs, 'delist').mockResolvedValue(makeDelistInstruction(addr(1)));
      const targets = [addr(10), addr(11), addr(12)];

      const instructions = await jobs.delistMany(targets);

      expect(instructions).toHaveLength(3);
      expect(spy).toHaveBeenNthCalledWith(1, { job: addr(10) });
      expect(spy).toHaveBeenNthCalledWith(3, { job: addr(12) });
    });

    it('quitMany passes addresses through as the run account', async () => {
      const spy = vi
        .spyOn(jobs, 'quit')
        .mockResolvedValue({ programAddress: addr(0), accounts: [], data: new Uint8Array() });

      await jobs.quitMany([addr(20), addr(21)]);

      expect(spy).toHaveBeenNthCalledWith(1, { run: addr(20) });
      expect(spy).toHaveBeenNthCalledWith(2, { run: addr(21) });
    });

    it('closeMany passes addresses through as the market account', async () => {
      const spy = vi
        .spyOn(jobs, 'close')
        .mockResolvedValue({ programAddress: addr(0), accounts: [], data: new Uint8Array() });

      await jobs.closeMany([addr(30)]);

      expect(spy).toHaveBeenCalledWith({ market: addr(30) });
    });
  });

  describe('params-array bulk builders', () => {
    const fakeIx: Instruction = { programAddress: addr(0), accounts: [], data: new Uint8Array() };

    it('assignMany builds `count` assigns from one set of params', async () => {
      const spy = vi.spyOn(jobs, 'assign').mockResolvedValue(fakeIx);
      const params = { market: addr(2), timeout: 1, ipfsHash: 'h', node: addr(3) };

      const instructions = await jobs.assignMany(params, 3);

      expect(instructions).toHaveLength(3);
      expect(spy).toHaveBeenCalledTimes(3);
      expect(spy).toHaveBeenCalledWith(params);
    });

    it('assignMany builds one assign per element when given an array', async () => {
      const spy = vi.spyOn(jobs, 'assign').mockResolvedValue(fakeIx);
      const params = [
        { market: addr(2), timeout: 1, ipfsHash: 'a', node: addr(3) },
        { market: addr(2), timeout: 2, ipfsHash: 'b', node: addr(4) },
      ];

      await jobs.assignMany(params);

      expect(spy).toHaveBeenNthCalledWith(1, params[0]);
      expect(spy).toHaveBeenNthCalledWith(2, params[1]);
    });

    it('extendMany forwards each params entry to extend', async () => {
      const spy = vi.spyOn(jobs, 'extend').mockResolvedValue(fakeIx);
      const params = [
        { job: addr(10), timeout: 100 },
        { job: addr(11), timeout: 200 },
      ];

      const instructions = await jobs.extendMany(params);

      expect(instructions).toHaveLength(2);
      expect(spy).toHaveBeenNthCalledWith(1, params[0]);
      expect(spy).toHaveBeenNthCalledWith(2, params[1]);
    });

    it('completeMany forwards each params entry to complete', async () => {
      const spy = vi.spyOn(jobs, 'complete').mockResolvedValue(fakeIx);
      const params = [{ job: addr(10), ipfsResultsHash: 'r' }];

      await jobs.completeMany(params);

      expect(spy).toHaveBeenCalledWith(params[0]);
    });

    it('finishMany returns one atomic group per job', async () => {
      // finish can expand to several instructions that must stay together.
      const spy = vi.spyOn(jobs, 'finish').mockResolvedValue([fakeIx]);
      const params = [
        { job: addr(10), ipfsResultsHash: 'r1' },
        { job: addr(11), ipfsResultsHash: 'r2' },
      ];

      const groups = await jobs.finishMany(params);

      expect(groups).toHaveLength(2);
      expect(Array.isArray(groups[0])).toBe(true);
      expect(spy).toHaveBeenNthCalledWith(2, params[1]);
    });
  });

  describe('sendBatch result enrichment', () => {
    it('decodes list instructions and groups created accounts by role', async () => {
      const ixA = makeListInstruction(addr(1));
      const ixB = makeListInstruction(addr(2));
      stubBatch(deps, [ixA, ixB]);

      const results = await jobs.sendBatch([ixA, ixB]);

      expect(results).toHaveLength(1);
      expect(results[0].confirmed).toBe(true);
      // Every list instruction's `job` is collected under the pluralised key.
      expect(results[0].accounts.jobs).toEqual([addr(1), addr(2)]);
      expect(results[0].accounts.runs).toHaveLength(2);
      // decoded stays index-aligned with the transaction's instructions.
      expect(results[0].decoded.map((d) => d?.name)).toEqual(['list', 'list']);
    });

    it('exposes the same accounts shape for a non-list (delist) batch', async () => {
      const ixA = makeDelistInstruction(addr(5));
      const ixB = makeDelistInstruction(addr(6));
      stubBatch(deps, [ixA, ixB]);

      const results = await jobs.sendBatch([ixA, ixB]);

      // `accounts.jobs` means the same thing whether you listed or delisted.
      expect(results[0].accounts.jobs).toEqual([addr(5), addr(6)]);
      expect(results[0].decoded.map((d) => d?.name)).toEqual(['delist', 'delist']);
    });

    it('leaves accounts empty for a transaction with no recognised jobs instructions', async () => {
      const foreign: Instruction = {
        programAddress: addr(0),
        accounts: [],
        data: new Uint8Array([1, 2, 3]),
      };
      stubBatch(deps, [foreign]);

      const results = await jobs.sendBatch([foreign]);

      expect(results[0].accounts).toEqual({});
      expect(results[0].decoded).toEqual([undefined]);
    });
  });

  describe('signBatch', () => {
    it('passes through the signed result and enriches it like sendBatch', async () => {
      const ixA = makeListInstruction(addr(1));
      const ixB = makeListInstruction(addr(2));
      const buildAndSign = vi.fn().mockResolvedValue([
        {
          blob: 'BASE64_BLOB',
          signature: 'sig',
          lastValidBlockHeight: 123n,
          instructions: [ixA, ixB],
          groupIndices: [0, 1],
        },
      ]);
      (deps.solana as unknown as { buildAndSignBatch: unknown }).buildAndSignBatch = buildAndSign;

      const signed = await jobs.signBatch([ixA, ixB]);

      // Signed (un-sent) fields pass straight through.
      expect(signed).toHaveLength(1);
      expect(signed[0].blob).toBe('BASE64_BLOB');
      expect(signed[0].signature).toBe('sig');
      expect(signed[0].lastValidBlockHeight).toBe(123n);
      // Same decoded/accounts enrichment as sendBatch.
      expect(signed[0].accounts.jobs).toEqual([addr(1), addr(2)]);
      expect(signed[0].decoded.map((d) => d?.name)).toEqual(['list', 'list']);
      // Prices instructions with the static jobs table (no simulation).
      expect(buildAndSign).toHaveBeenCalledWith(
        [ixA, ixB],
        expect.objectContaining({ computeUnits: expect.any(Function) })
      );
    });
  });
});
