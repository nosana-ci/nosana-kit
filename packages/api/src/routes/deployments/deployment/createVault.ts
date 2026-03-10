import { vaultGetBalance, vaultTopup, vaultWithdraw } from './actions/index.js';

import type { TopupVaultOptions, Vault } from '../types.js';
import type { DeploymentRouteClientsWithSigner } from '../../../types.js';

/**
 * Creates a Vault object with methods for managing vault operations.
 *
 * TODO: Once @nosana/kit exports TokenManager and vault utilities, update the action
 * implementations to use them instead of throwing errors.
 *
 * @param vaultAddress - The vault's Solana address
 * @param clients - Clients including DeploymentManagerClient and Solana functions
 * @param created_at - Optional creation timestamp
 * @returns A Vault object with methods
 */
export function createVault(
  vaultAddress: string,
  clients: DeploymentRouteClientsWithSigner,
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
      return await vaultGetBalance(vaultAddress, clients);
    },

    /**
     * Tops up the vault with SOL and/or NOS.
     * TODO: Implementation in actions/vaultTopup.ts
     */
    topup: async (topupOptions: TopupVaultOptions) => {
      return await vaultTopup(vaultAddress, topupOptions, clients);
    },

    /**
     * Withdraws all tokens from the vault.
     * TODO: Implementation in actions/vaultWithdraw.ts
     */
    withdraw: async () => {
      await vaultWithdraw(vaultAddress, clients);
    },
  };
}
