import type { Address, TransactionSigner } from '@solana/kit';
import type { getExtendInstruction } from '../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type ExtendParams = {
  job: Address;
  timeout: number | bigint;
  payer?: TransactionSigner;
};

export type ExtendInstruction = ReturnType<typeof getExtendInstruction>;

export type Extend = (params: ExtendParams) => Promise<ExtendInstruction>;

export async function extend(
  { job, timeout, payer }: ExtendParams,
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

    // Use provided payer or fall back to wallet
    const nosPayer = payer ?? wallet;

    // Create the extend instruction
    return client.getExtendInstruction({
      job,
      timeout,
      market,
      vault,
      payer: nosPayer,
      authority: wallet,
      user: associatedTokenAddress,
      ...staticAccounts,
    });
  } catch (err) {
    const errorMessage = `Failed to create extend instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
