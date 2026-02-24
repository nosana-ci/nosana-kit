import { describe, it, expect } from 'vitest';

import { resolvePriorityFeeMicroLamports } from '../../../../src/services/solana/priorityFees.js';

const FIXED_MICRO_LAMPORTS = 5_000;
const DYNAMIC_MIN = 1_000;
const DYNAMIC_MAX = 100_000;
const MOCK_FEES_50TH = 1_000n;
const MOCK_FEES = [
  { prioritizationFee: 100n, slot: 1n },
  { prioritizationFee: 500n, slot: 2n },
  { prioritizationFee: MOCK_FEES_50TH, slot: 3n },
  { prioritizationFee: 2000n, slot: 4n },
  { prioritizationFee: 5000n, slot: 5n },
];

function createMockRpc(sendValue: readonly { prioritizationFee: bigint; slot: bigint }[]) {
  return {
    getRecentPrioritizationFees: () => ({
      send: () => Promise.resolve(sendValue),
    }),
  };
}

function createMockRpcThatThrows() {
  return {
    getRecentPrioritizationFees: () => ({
      send: () => Promise.reject(new Error('RPC error')),
    }),
  };
}

describe('resolvePriorityFeeMicroLamports', () => {
  it('returns fixed microLamports when type is fixed', async () => {
    const rpc = createMockRpc(MOCK_FEES);
    const result = await resolvePriorityFeeMicroLamports(
      { type: 'fixed', microLamports: FIXED_MICRO_LAMPORTS },
      rpc as any
    );
    expect(result).toBe(BigInt(FIXED_MICRO_LAMPORTS));
  });

  it('returns min as fallback when dynamic and RPC returns empty', async () => {
    const rpc = createMockRpc([]);
    const result = await resolvePriorityFeeMicroLamports(
      { type: 'dynamic', min: DYNAMIC_MIN },
      rpc as any
    );
    expect(result).toBe(BigInt(DYNAMIC_MIN));
  });

  it('returns 0 when dynamic, empty fees, and no min set', async () => {
    const rpc = createMockRpc([]);
    const result = await resolvePriorityFeeMicroLamports({ type: 'dynamic' }, rpc as any);
    expect(result).toBe(0n);
  });

  it('returns strategy percentile and clamps to min/max when dynamic', async () => {
    const rpc = createMockRpc(MOCK_FEES);
    const result = await resolvePriorityFeeMicroLamports(
      {
        type: 'dynamic',
        strategy: 'medium',
        min: DYNAMIC_MIN,
        max: DYNAMIC_MAX,
      },
      rpc as any
    );
    expect(result).toBe(MOCK_FEES_50TH);
  });

  it('falls back to min when dynamic and RPC throws', async () => {
    const rpc = createMockRpcThatThrows();
    const result = await resolvePriorityFeeMicroLamports(
      { type: 'dynamic', min: DYNAMIC_MIN },
      rpc as any
    );
    expect(result).toBe(BigInt(DYNAMIC_MIN));
  });
});
