import type { Address } from '@solana/kit';
import type { getDelistInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type DelistParams = {
  job: Address;
};

export type DelistInstruction = ReturnType<typeof getDelistInstruction>;

export type Delist = (params: DelistParams) => Promise<DelistInstruction>;

export async function delist(
  { job }: DelistParams,
  {
    config,
    deps,
    client,
    get,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<DelistInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [{ market, payer }, { jobsProgram }] = await Promise.all([
      get(job, false),
      getStaticAccounts(),
    ]);

    // Get associated token address for the job's payer
    const [payerATA, vault] = await Promise.all([
      getNosATA(payer),
      deps.solana.pda([market, config.nosTokenAddress], jobsProgram),
    ]);

    return client.getDelistInstruction({
      job,
      market,
      vault,
      deposit: payerATA, // Associated token address for the job's payer
      payer,
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create delist instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
