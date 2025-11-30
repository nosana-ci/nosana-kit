import type { Address } from '@solana/kit';
import type { getExtendInstruction } from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type ExtendParams = {
  job: Address;
  timeout: number | bigint;
};

export type ExtendInstruction = ReturnType<typeof getExtendInstruction>;

export type Extend = (params: ExtendParams) => Promise<ExtendInstruction>;

export async function extend(
  { job, timeout }: ExtendParams,
  {
    config,
    deps,
    client,
    get,
    getRequiredWallet,
    getAssociatedTokenPda,
    getStaticAccounts,
  }: InstructionsHelperParams
): Promise<ExtendInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [{ market }, [associatedTokenAddress], { jobsProgram, ...staticAccounts }] =
      await Promise.all([get(job, false), getAssociatedTokenPda(), getStaticAccounts()]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    // Create the extend instruction
    return client.getExtendInstruction({
      job,
      timeout,
      market,
      vault,
      payer: wallet,
      authority: wallet,
      user: associatedTokenAddress,
      ...staticAccounts,
    });
  } catch (err) {
    const errorMessage = `Failed to create list instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
