import type { Address } from '@solana/kit';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { getEndInstruction } from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type EndParams = {
  job: Address;
};

export type EndInstruction = ReturnType<typeof getEndInstruction>;

export type End = (params: EndParams) => Promise<EndInstruction>;

export async function end(
  { job }: EndParams,
  {
    config,
    deps,
    client,
    get,
    getRuns,
    getRequiredWallet,
    getStaticAccounts,
  }: InstructionsHelperParams
): Promise<EndInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [jobAccount, [run], { jobsProgram }] = await Promise.all([
      get(job, false),
      getRuns({ job }),
      getStaticAccounts(),
    ]);

    if (!run) {
      throw new Error('No job run account found for the specified job');
    }

    // Get associated token address for the job's payer
    const [associatedTokenPda] = await findAssociatedTokenPda({
      mint: config.nosTokenAddress,
      owner: jobAccount.payer,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const vault = await deps.solana.pda([jobAccount.market, config.nosTokenAddress], jobsProgram);

    return client.getEndInstruction({
      job,
      market: jobAccount.market,
      run: run.address, // Todo: Set these accounts properly
      deposit: associatedTokenPda, // Deposit is the same as user (associated token address)
      user: associatedTokenPda, // Associated token address for the job's payer
      vault: vault,
      payer: jobAccount.payer, // Use payer from the job account
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create end instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
