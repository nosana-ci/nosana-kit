import type { Address } from '@solana/kit';
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
    getAssociatedTokenPda,
  }: InstructionsHelperParams
): Promise<EndInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [{ market }, [run], { jobsProgram }, [associatedTokenPda]] = await Promise.all([
      get(job, false),
      getRuns({ job }),
      getStaticAccounts(),
      getAssociatedTokenPda(),
    ]);

    if (!run) {
      throw new Error('No job run account found for the specified job');
    }

    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    return client.getEndInstruction({
      job,
      market,
      run: run.address, // Todo: Set these accounts properly
      deposit: undefined, // Todo: Set these accounts properly
      user: associatedTokenPda, // Todo: Set these accounts properly
      vault: vault,
      payer: wallet.address,
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create end instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
