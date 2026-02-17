import type { Address } from '@solana/kit';

import type { getStopInstruction } from '@nosana/jobs-program';
import type { InstructionsHelperParams } from './types.js';

export type StopParams = {
  market: Address;
  node?: Address;
};

export type StopInstruction = ReturnType<typeof getStopInstruction>;

export type Stop = (params: StopParams) => Promise<StopInstruction>;

export async function stop(
  { market, node }: StopParams,
  { deps, client, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<StopInstruction> {
  try {
    const wallet = getRequiredWallet();

    // Get static accounts
    const { jobsProgram, ...staticAccounts } = await getStaticAccounts();

    // Use provided node or default to wallet address
    const nodeAddress = node ?? wallet.address;

    return client.getStopInstruction(
      {
        market,
        node: nodeAddress,
        authority: wallet,
        ...staticAccounts,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create stop instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
