import { errorFormatter } from "../../../../utils/errorFormatter.js";

import type { RouteOptionsWithSigner } from "../../../../types.js";

/**
 * Gets the balance of a vault.
 *
 * TODO: Implement with @nosana/kit TokenManager once available.
 * Should fetch SOL and NOS balances from the vault address.
 *
 * @param vaultAddress - The vault's Solana address
 * @returns Promise with SOL and NOS balances
 */
export async function vaultGetBalance(
  vaultAddress: string,
  { solana: { getBalance } }: RouteOptionsWithSigner
): Promise<{ SOL: number; NOS: number }> {
  try {
    return await getBalance(vaultAddress);
  } catch (error) {
    throw errorFormatter('Failed to get vault balance', error);
  }
}
