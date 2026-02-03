import type { Address } from '@solana/kit';

import type { getQuitInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type QuitParams = {
  run: Address;
};

export type QuitInstruction = ReturnType<typeof getQuitInstruction>;

export type Quit = (params: QuitParams) => Promise<QuitInstruction>;

export async function quit(
  { run }: QuitParams,
  { deps, client, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<QuitInstruction> {
  try {
    const wallet = getRequiredWallet();

    // Fetch run account and get static accounts in parallel
    const [runAccount, { jobsProgram, ...staticAccounts }] = await Promise.all([
      client.fetchRunAccount(deps.solana.rpc, run),
      getStaticAccounts(),
    ]);

    return client.getQuitInstruction(
      {
        job: runAccount.data.job,
        run,
        payer: runAccount.data.payer,
        authority: wallet,
        ...staticAccounts,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create quit instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
