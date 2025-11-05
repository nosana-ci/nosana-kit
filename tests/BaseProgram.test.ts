import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseProgram } from '../src/programs/BaseProgram.js';
import { address, type Address } from 'gill';
import type { NosanaClient } from '../src/index.js';

class TestProgram extends BaseProgram {
  protected getProgramId(): Address {
    return address('test-program');
  }
}

function makeSdk(): NosanaClient {
  const valid = '11111111111111111111111111111111';
  const pda = vi.fn()
    .mockResolvedValueOnce(address(valid))
    .mockResolvedValueOnce(address(valid));
  const sdk = {
    solana: { pda },
    config: {
      programs: {
        rewardsAddress: address(valid),
        jobsAddress: address(valid),
        nosTokenAddress: address(valid),
        stakeAddress: address(valid),
        poolsAddress: address(valid),
      },
    },
    logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
  } as unknown as NosanaClient;
  return sdk;
}

describe('BaseProgram', () => {
  describe('getStaticAccounts', () => {
    let sdk: NosanaClient;
    let program: TestProgram;

    beforeEach(() => {
      vi.restoreAllMocks();
      sdk = makeSdk();
      program = new TestProgram(sdk);
    });

    it('initializes once and caches the result', async () => {
      const first = await program.getStaticAccounts();
      const second = await program.getStaticAccounts();

      expect(first).toBe(second); // same object instance
      expect((sdk.solana.pda as any)).toHaveBeenCalledTimes(2); // reflection + vault
    });

    it('handles concurrent calls sharing initialization', async () => {
      const [a, b, c] = await Promise.all([
        program.getStaticAccounts(),
        program.getStaticAccounts(),
        program.getStaticAccounts(),
      ]);
      expect(a).toBe(b);
      expect(b).toBe(c);
      expect((sdk.solana.pda as any)).toHaveBeenCalledTimes(2);
    });

    it('uses correct PDA seeds and programs', async () => {
      await program.getStaticAccounts();
      const calls = (sdk.solana.pda as any).mock.calls;
      // First call: ['reflection'], rewardsProgram
      expect(calls[0][0]).toEqual(['reflection']);
      expect(calls[0][1]).toBe(sdk.config.programs.rewardsAddress);
      // Second call: [nosTokenAddress], rewardsProgram
      expect(calls[1][0]).toEqual([sdk.config.programs.nosTokenAddress]);
      expect(calls[1][1]).toBe(sdk.config.programs.rewardsAddress);
    });
  });
});


