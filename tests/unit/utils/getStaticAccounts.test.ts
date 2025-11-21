import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStaticAccounts,
  type StaticAccountsCache,
} from '../../../src/utils/getStaticAccounts.js';
import { ClientFactory } from '../helpers/index.js';
import type { ClientConfig } from '../../../src/config/types.js';
import type { SolanaService } from '../../../src/services/SolanaService.js';

describe('getStaticAccounts', () => {
  let config: ClientConfig;
  let solana: SolanaService;

  beforeEach(() => {
    const client = ClientFactory.createMainnet();
    solana = client.solana;
    config = client.config;
  });

  it('returns static accounts with correct structure', async () => {
    const accounts = await getStaticAccounts(config.programs, solana);

    // observable behavior: returns all required static accounts
    expect(accounts.rewardsReflection).toBeDefined();
    expect(accounts.rewardsVault).toBeDefined();
    expect(accounts.rewardsProgram).toBe(config.programs.rewardsAddress);
    expect(accounts.jobsProgram).toBe(config.programs.jobsAddress);
  });

  it('derives reflection PDA with correct seeds', async () => {
    const reflectionSeed = ['reflection'];
    const accounts = await getStaticAccounts(config.programs, solana);

    // observable behavior: reflection PDA is derived correctly
    // We verify by checking the result is deterministic - same inputs = same output
    const reflectionPda = await solana.pda(reflectionSeed, config.programs.rewardsAddress);
    expect(accounts.rewardsReflection).toBe(reflectionPda);
  });

  it('derives vault PDA with correct seeds', async () => {
    const accounts = await getStaticAccounts(config.programs, solana);

    // observable behavior: vault PDA is derived correctly
    const vaultPda = await solana.pda(
      [config.programs.nosTokenAddress],
      config.programs.rewardsAddress
    );
    expect(accounts.rewardsVault).toBe(vaultPda);
  });

  it('caches the result when cache object is provided', async () => {
    const cache: StaticAccountsCache = {};

    // first call
    const first = await getStaticAccounts(config.programs, solana, cache);

    // second call
    const second = await getStaticAccounts(config.programs, solana, cache);

    // observable behavior: cached value returned, same object instance
    expect(first).toBe(second);
    expect(first.rewardsReflection).toBe(second.rewardsReflection);
    expect(first.rewardsVault).toBe(second.rewardsVault);
  });

  it('shares initialization promise for concurrent calls', async () => {
    const cache: StaticAccountsCache = {};

    // multiple concurrent calls
    const [a, b, c] = await Promise.all([
      getStaticAccounts(config.programs, solana, cache),
      getStaticAccounts(config.programs, solana, cache),
      getStaticAccounts(config.programs, solana, cache),
    ]);

    // observable behavior: all return same result (same object instance)
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a.rewardsReflection).toBe(b.rewardsReflection);
    expect(a.rewardsVault).toBe(b.rewardsVault);
  });

  it('works without cache object', async () => {
    const accounts = await getStaticAccounts(config.programs, solana);

    // observable behavior: returns accounts even without cache
    expect(accounts.rewardsReflection).toBeDefined();
    expect(accounts.rewardsVault).toBeDefined();
    expect(accounts.rewardsProgram).toBe(config.programs.rewardsAddress);
    expect(accounts.jobsProgram).toBe(config.programs.jobsAddress);
  });
});
