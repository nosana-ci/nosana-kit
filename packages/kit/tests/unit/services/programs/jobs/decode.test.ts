import { describe, it, expect } from 'vitest';
import { type Instruction, AccountRole, address } from '@solana/kit';
import bs58 from 'bs58';
import {
  getDelistInstructionDataEncoder,
  getListInstructionDataEncoder,
} from '@nosana/jobs-program';

import { decodeJobsInstruction } from '../../../../../src/services/programs/jobs/decode.js';

// A valid 32-byte address derived from a seed (high byte set so it encodes full length).
function addr(seed: number) {
  const buf = new Uint8Array(32);
  buf[0] = 100 + seed;
  buf[31] = seed;
  return address(bs58.encode(buf));
}

const JOBS_PROGRAM = addr(0);

// The account order parseListInstruction reads them in.
const LIST_ACCOUNT_ORDER = [
  'job',
  'market',
  'run',
  'user',
  'vault',
  'payer',
  'rewardsReflection',
  'rewardsVault',
  'authority',
  'rewardsProgram',
  'tokenProgram',
  'systemProgram',
] as const;

function makeListInstruction(): Instruction {
  const accounts = LIST_ACCOUNT_ORDER.map((_, i) => ({
    address: addr(i + 1),
    role: AccountRole.READONLY,
  }));
  const data = getListInstructionDataEncoder().encode({
    ipfsJob: new Uint8Array(32),
    timeout: 0,
  });
  return { programAddress: JOBS_PROGRAM, accounts, data };
}

// The account order parseDelistInstruction reads them in (job is first).
const DELIST_ACCOUNT_ORDER = [
  'job',
  'market',
  'deposit',
  'payer',
  'vault',
  'tokenProgram',
  'authority',
] as const;

function makeDelistInstruction(): Instruction {
  const accounts = DELIST_ACCOUNT_ORDER.map((_, i) => ({
    address: addr(i + 1),
    role: AccountRole.READONLY,
  }));
  return {
    programAddress: JOBS_PROGRAM,
    accounts,
    data: getDelistInstructionDataEncoder().encode({}),
  };
}

describe('decodeJobsInstruction', () => {
  it('decodes a list instruction and labels its accounts', () => {
    const decoded = decodeJobsInstruction(makeListInstruction());

    expect(decoded?.name).toBe('list');
    // The created job/run addresses are recovered from the instruction's metas.
    expect(decoded?.accounts.job).toBe(addr(1));
    expect(decoded?.accounts.market).toBe(addr(2));
    expect(decoded?.accounts.run).toBe(addr(3));
    expect(decoded?.accounts.authority).toBe(addr(9));
  });

  it('decodes the instruction arguments', () => {
    const decoded = decodeJobsInstruction(makeListInstruction());
    expect(decoded?.data.timeout).toBe(0n);
  });

  it('decodes a non-list instruction (delist) with the same shape', () => {
    const decoded = decodeJobsInstruction(makeDelistInstruction());

    expect(decoded?.name).toBe('delist');
    // `job` is labelled identically to a list, so exploration is uniform across ops.
    expect(decoded?.accounts.job).toBe(addr(1));
    expect(decoded?.accounts.market).toBe(addr(2));
  });

  it('returns undefined for an unknown (non-jobs) instruction', () => {
    const ix: Instruction = {
      programAddress: JOBS_PROGRAM,
      accounts: [{ address: JOBS_PROGRAM, role: AccountRole.READONLY }],
      data: new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9, 0, 0]),
    };
    expect(decodeJobsInstruction(ix)).toBeUndefined();
  });

  it('returns undefined when the instruction data is shorter than a discriminator', () => {
    const ix: Instruction = {
      programAddress: JOBS_PROGRAM,
      accounts: [],
      data: new Uint8Array([1, 2, 3]),
    };
    expect(decodeJobsInstruction(ix)).toBeUndefined();
  });

  it('returns undefined (does not throw) when accounts are missing', () => {
    // A correctly-identified list instruction whose accounts were stripped: the
    // parser throws "Not enough accounts" and we swallow it to undefined.
    const data = getListInstructionDataEncoder().encode({
      ipfsJob: new Uint8Array(32),
      timeout: 0,
    });
    const ix: Instruction = { programAddress: JOBS_PROGRAM, accounts: [], data };
    expect(decodeJobsInstruction(ix)).toBeUndefined();
  });
});
