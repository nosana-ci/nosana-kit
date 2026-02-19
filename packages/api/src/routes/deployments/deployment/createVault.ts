import {
  vaultGetBalance,
  vaultTopup,
  vaultWithdraw,
} from './actions/index.js';

import type { TopupVaultOptions, Vault } from '../types.js';
import type { RouteOptionsWithSigner } from '../../../types.js';

/**
 * Creates a Vault object with methods for managing vault operations.
 *
 * TODO: Once @nosana/kit exports TokenManager and vault utilities, update the action
 * implementations to use them instead of throwing errors.
 *
 * @param vaultAddress - The vault's Solana address
 * @param options - Options including QueryClient for API calls
 * @param created_at - Optional creation timestamp
 * @returns A Vault object with methods
 */
export function createVault(
  vaultAddress: string,
  options: RouteOptionsWithSigner,
  created_at?: Date,
): Vault {

  return {
    address: vaultAddress,
    ...(created_at ? { created_at } : {}),

    /**
       * Gets the current balance of the vault.
       * TODO: Implementation in actions/vaultGetBalance.ts
     */
    getBalance: async () => {
      return await vaultGetBalance(vaultAddress, options);
    },

    /**
       * Tops up the vault with SOL and/or NOS.
       * TODO: Implementation in actions/vaultTopup.ts
     */
    topup: async (topupOptions: TopupVaultOptions) => {
      return await vaultTopup(vaultAddress, topupOptions, options);
    },

    /**
       * Withdraws all tokens from the vault.
       * TODO: Implementation in actions/vaultWithdraw.ts
     */
    withdraw: async () => {
      await vaultWithdraw(vaultAddress, options);
    },
  };
}
