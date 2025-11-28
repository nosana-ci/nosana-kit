import type { Address } from '@solana/kit';
import * as programClient from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type DelistParams = {
  job: Address;
};

export type DelistInstruction = ReturnType<typeof programClient.getDelistInstruction>;

export type Delist = (params: DelistParams) => Promise<DelistInstruction>;

export async function delist(
  { job }: DelistParams,
  { config, deps, client, get, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<DelistInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [{ market }, { jobsProgram }] = await Promise.all([get(job, false), getStaticAccounts()]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    return client.getDelistInstruction({
      job,
      market,
      vault,
      deposit: undefined, // Todo: Set account properly
      payer: wallet.address,
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create delist instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
