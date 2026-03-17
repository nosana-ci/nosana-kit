import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { TopupVaultOptions } from '../../types.js';
import type { RouteOptionsWithSigner } from '../../../../types.js';

/**
 * Tops up a vault with SOL and/or NOS.
 *
 * TODO: Implement with @nosana/kit TokenManager once available.
 * Should use TokenManager to transfer SOL/NOS to the vault.
 *
 * @param _vaultAddress - The vault's Solana address
 * @param _options - Topup options (SOL, NOS amounts)
 * @returns Promise that resolves when topup is complete
 */
export async function vaultTopup(
  vaultAddress: string,
  options: TopupVaultOptions,
  { solana: { transferTokensToRecipient } }: RouteOptionsWithSigner
): Promise<void> {
  try {
    await transferTokensToRecipient(vaultAddress, options);
  } catch (error) {
    throw errorFormatter('Failed to top up vault', error);
  }
}
