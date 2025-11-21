import { Address } from '@solana/kit';
import type { SolanaService } from '../services/SolanaService.js';
import type { ProgramConfig } from '../config/types.js';

export type StaticAccounts = {
  rewardsReflection: Address;
  rewardsVault: Address;
  rewardsProgram: Address;
  jobsProgram: Address;
};

export type StaticAccountsCache = {
  value?: StaticAccounts;
  promise?: Promise<StaticAccounts>;
};

/**
 * Gets the static accounts, initializing them if needed.
 * This function caches the result to avoid redundant PDA lookups.
 *
 * @param programsConfig - Programs configuration
 * @param solana - Solana service for PDA lookups
 * @param cache - Optional cache object to store the result (for memoization)
 * @returns Promise resolving to static accounts
 */
export async function getStaticAccounts(
  programsConfig: ProgramConfig,
  solana: SolanaService,
  cache?: StaticAccountsCache
): Promise<StaticAccounts> {
  // Return cached value if available
  if (cache?.value) {
    return cache.value;
  }

  // If we're already initializing, return the existing promise
  if (cache?.promise) {
    return cache.promise;
  }

  // Start initialization and store the promise
  const promise = (async () => {
    const staticAccounts: StaticAccounts = {
      rewardsReflection: await solana.pda(['reflection'], programsConfig.rewardsAddress),
      rewardsVault: await solana.pda(
        [programsConfig.nosTokenAddress],
        programsConfig.rewardsAddress
      ),
      rewardsProgram: programsConfig.rewardsAddress,
      jobsProgram: programsConfig.jobsAddress,
    };

    // Cache the result
    if (cache) {
      cache.value = staticAccounts;
      cache.promise = undefined;
    }

    return staticAccounts;
  })();

  if (cache) {
    cache.promise = promise;
  }

  return promise;
}
