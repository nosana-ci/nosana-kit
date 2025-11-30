import type { Address } from '@solana/kit';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { getDelistInstruction } from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type DelistParams = {
  job: Address;
};

export type DelistInstruction = ReturnType<typeof getDelistInstruction>;

export type Delist = (params: DelistParams) => Promise<DelistInstruction>;

export async function delist(
  { job }: DelistParams,
  { config, deps, client, get, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<DelistInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [jobAccount, { jobsProgram }] = await Promise.all([get(job, false), getStaticAccounts()]);
    
    // Get associated token address for the job's payer
    const [payerATA] = await findAssociatedTokenPda({
      mint: config.nosTokenAddress,
      owner: jobAccount.payer,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const vault = await deps.solana.pda([jobAccount.market, config.nosTokenAddress], jobsProgram);

    return client.getDelistInstruction({
      job,
      market: jobAccount.market,
      vault,
      deposit: payerATA, // Associated token address for the job's payer
      payer: jobAccount.payer, // Use payer from the job account
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create delist instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
