import { Address } from '@solana/kit';
import type { SolanaService } from '../services/SolanaService.js';
import { ClientConfig } from '../config/types.js';

export type StaticAccounts = {
  rewardsReflection: Address;
  rewardsVault: Address;
  rewardsProgram: Address;
  jobsProgram: Address;
};

/**
 * Gets the static accounts, initializing them if needed.
 * This function caches the result to avoid redundant PDA lookups.
 *
 * @param config - Client configuration
 * @param solana - Solana service for PDA lookups
 * @param cache - Optional cache object to store the result (for memoization)
 * @returns Promise resolving to static accounts
 */
export async function getStaticAccounts(
  config: ClientConfig,
  solana: SolanaService,
  cache?: { value?: StaticAccounts; promise?: Promise<StaticAccounts> }
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
      rewardsReflection: await solana.pda(['reflection'], config.programs.rewardsAddress),
      rewardsVault: await solana.pda(
        [config.programs.nosTokenAddress],
        config.programs.rewardsAddress
      ),
      rewardsProgram: config.programs.rewardsAddress,
      jobsProgram: config.programs.jobsAddress,
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
