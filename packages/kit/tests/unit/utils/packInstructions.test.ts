import { describe, it, expect, beforeAll } from 'vitest';
import {
  type Address,
  type Blockhash,
  type Instruction,
  AccountRole,
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithinSizeLimit,
  compileTransaction,
  createTransactionMessage,
  generateKeyPairSigner,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';

import { packInstructions, TRANSACTION_SIZE_LIMIT } from '../../../src/utils/packInstructions.js';

const PROGRAM = address('ComputeBudget111111111111111111111111111111');
const FEE_PAYER = address('11111111111111111111111111111112');
const BLOCKHASH = {
  blockhash: '11111111111111111111111111111111' as Blockhash,
  lastValidBlockHeight: 0n,
};

// A pool of distinct account addresses so each instruction can reference unique
// (non-deduplicated) accounts, making transaction size grow predictably.
let pool: Address[] = [];

beforeAll(async () => {
  pool = await Promise.all(
    Array.from({ length: 64 }, () => generateKeyPairSigner().then((s) => s.address))
  );
});

/** Build an instruction referencing `accountCount` unique accounts plus `dataLen` bytes. */
function makeIx(index: number, accountCount = 2, dataLen = 64): Instruction {
  const accounts = Array.from({ length: accountCount }, (_, i) => ({
    address: pool[(index * accountCount + i) % pool.length],
    role: AccountRole.READONLY,
  }));
  return {
    programAddress: PROGRAM,
    accounts,
    data: new Uint8Array(dataLen).fill(index % 256),
  };
}

/** Compile a bucket the way the sender will and return its serialized byte size. */
function bucketSize(bucket: Instruction[]): number {
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(FEE_PAYER, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(BLOCKHASH, tx),
    (tx) => appendTransactionMessageInstructions(bucket, tx)
  );
  // Throws if over the size limit — an independent check of the packer's promise.
  const tx = compileTransaction(message);
  assertIsTransactionWithinSizeLimit(tx);
  return tx.messageBytes.length;
}

describe('packInstructions', () => {
  it('returns an empty array for no groups', () => {
    expect(packInstructions([])).toEqual([]);
  });

  it('skips empty groups', () => {
    expect(packInstructions([[], []])).toEqual([]);
  });

  it('keeps everything in one transaction when it fits', () => {
    const ixs = Array.from({ length: 3 }, (_, i) => makeIx(i));
    const buckets = packInstructions(ixs, { feePayer: FEE_PAYER });
    expect(buckets).toHaveLength(1);
    expect(buckets[0]).toHaveLength(3);
  });

  it('splits into multiple transactions when the size limit is exceeded', () => {
    const ixs = Array.from({ length: 30 }, (_, i) => makeIx(i));
    const buckets = packInstructions(ixs, { feePayer: FEE_PAYER });

    // More than one transaction is needed.
    expect(buckets.length).toBeGreaterThan(1);
    // No instruction is lost or duplicated.
    expect(buckets.flat()).toHaveLength(30);
    // Every produced transaction is within the real size limit.
    for (const bucket of buckets) {
      expect(bucketSize(bucket)).toBeLessThanOrEqual(TRANSACTION_SIZE_LIMIT);
    }
  });

  it('produces more, smaller transactions as the size budget shrinks', () => {
    const ixs = Array.from({ length: 30 }, (_, i) => makeIx(i));
    const wide = packInstructions(ixs, { feePayer: FEE_PAYER });
    const narrow = packInstructions(ixs, { feePayer: FEE_PAYER, maxTransactionSize: 400 });
    expect(narrow.length).toBeGreaterThan(wide.length);
    for (const bucket of narrow) {
      expect(bucketSize(bucket)).toBeLessThanOrEqual(400);
    }
  });

  it('never splits an atomic group across transactions', () => {
    // Each group is a pair of instructions that must travel together.
    const groups: Instruction[][] = Array.from({ length: 15 }, (_, i) => [
      makeIx(i * 2),
      makeIx(i * 2 + 1),
    ]);
    const buckets = packInstructions(groups, { feePayer: FEE_PAYER, maxTransactionSize: 600 });

    expect(buckets.length).toBeGreaterThan(1);
    // Each bucket holds a whole number of pairs (groups are never broken apart).
    for (const bucket of buckets) {
      expect(bucket.length % 2).toBe(0);
    }
    expect(buckets.flat()).toHaveLength(30);
  });

  it('accounts for reserved instructions in the size budget', () => {
    const ixs = Array.from({ length: 12 }, (_, i) => makeIx(i));
    const withoutReserved = packInstructions(ixs, { feePayer: FEE_PAYER, maxTransactionSize: 700 });
    // Reserve roughly one instruction's worth of space in every transaction.
    const reserved = [makeIx(99, 2, 64)];
    const withReserved = packInstructions(ixs, {
      feePayer: FEE_PAYER,
      maxTransactionSize: 700,
      reservedInstructions: reserved,
    });
    // Reserving space leaves room for fewer instructions per transaction.
    expect(withReserved.length).toBeGreaterThanOrEqual(withoutReserved.length);
    // Reserved instructions are measured but not emitted in the buckets.
    expect(withReserved.flat()).toHaveLength(12);
  });

  it('throws when a single atomic group cannot fit in one transaction', () => {
    // One group far larger than the limit cannot be split.
    const giant: Instruction[] = Array.from({ length: 10 }, (_, i) => makeIx(i, 4, 256));
    expect(() =>
      packInstructions([giant], { feePayer: FEE_PAYER, maxTransactionSize: 400 })
    ).toThrow(/cannot be split/);
  });

  it('splits on compute units when a CU estimator is provided', () => {
    // Tiny instructions (size never binds) so only the CU ceiling splits them.
    const ixs = Array.from({ length: 10 }, (_, i) => makeIx(i, 1, 8));
    const buckets = packInstructions(ixs, {
      feePayer: FEE_PAYER,
      computeUnits: () => 100_000,
      maxComputeUnits: 300_000,
    });
    // 300k budget / 100k per instruction = 3 per transaction.
    expect(buckets.length).toBe(Math.ceil(10 / 3));
    for (const bucket of buckets) {
      expect(bucket.length).toBeLessThanOrEqual(3);
    }
    expect(buckets.flat()).toHaveLength(10);
  });

  it('splits on whichever of size or compute units binds first', () => {
    const ixs = Array.from({ length: 12 }, (_, i) => makeIx(i, 1, 8));
    // Loose CU budget, tight size -> size decides.
    const sizeBound = packInstructions(ixs, {
      feePayer: FEE_PAYER,
      maxTransactionSize: 300,
      computeUnits: () => 1,
      maxComputeUnits: 1_400_000,
    });
    // Tight CU budget, loose size -> CU decides (2 per tx).
    const cuBound = packInstructions(ixs, {
      feePayer: FEE_PAYER,
      computeUnits: () => 100_000,
      maxComputeUnits: 200_000,
    });
    expect(cuBound.length).toBe(6);
    expect(sizeBound.flat()).toHaveLength(12);
    expect(cuBound.flat()).toHaveLength(12);
  });

  it('throws when a single group exceeds the compute-unit limit', () => {
    // A 2-instruction atomic group that fits by size but not by compute units.
    const group: Instruction[] = [makeIx(0, 1, 8), makeIx(1, 1, 8)];
    expect(() =>
      packInstructions([group], {
        feePayer: FEE_PAYER,
        computeUnits: () => 800_000,
        maxComputeUnits: 1_000_000,
      })
    ).toThrow(/compute units/);
  });
});
