import { errorFormatter } from '../../../../utils/errorFormatter.js';

import type { DeploymentRouteClientsWithSigner } from '../../../../types.js';

/**
 * Withdraws all tokens from a vault.
 *
 * TODO: Implement with @nosana/kit once available.
 * Should:
 * 1. Call deployment manager API to get withdrawal transaction
 * 2. Sign and send the transaction using wallet from @nosana/kit
 *
 * @param vaultAddress - The vault's Solana address
 * @param clients - Clients including DeploymentManagerClient and Solana functions
 * @returns Promise that resolves when withdrawal is complete
 */
export async function vaultWithdraw(
  vaultAddress: string,
  { deploymentManager: client, solana: { deserializeSignSendAndConfirmTransaction } }: DeploymentRouteClientsWithSigner
): Promise<void> {
  const { data, error } = await client.POST('/api/deployments/vaults/{vault}/withdraw', {
    params: {
      path: {
        vault: vaultAddress,
      }
    },
    body: {}
  });

  if (error || !data) {
    throw errorFormatter('Failed to withdraw from vault', error);
  }

  try {
    const { transaction } = data;
    await deserializeSignSendAndConfirmTransaction(transaction);
  } catch (error) {
    throw errorFormatter('Vault withdrawal transaction failed.', error);
  }
}
