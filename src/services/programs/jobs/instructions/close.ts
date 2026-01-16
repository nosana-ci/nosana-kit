import type { Address, TransactionSigner } from '@solana/kit';
import type { getCloseInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type CloseParams = {
  market: Address;
  payer?: TransactionSigner;
};

export type CloseInstruction = ReturnType<typeof getCloseInstruction>;

export type Close = (params: CloseParams) => Promise<CloseInstruction>;

export async function close(
  { market, payer }: CloseParams,
  {
    config,
    deps,
    client,
    getRequiredWallet,
    getStaticAccounts,
    getNosATA,
  }: InstructionsHelperParams
): Promise<CloseInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Use provided payer or fall back to wallet
    const nosPayer = payer ?? wallet;

    // Get jobs program address, user ATA, and derive vault PDA
    const [{ jobsProgram }, userATA] = await Promise.all([
      getStaticAccounts(),
      getNosATA(nosPayer.address),
    ]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    // Create the close instruction
    return client.getCloseInstruction(
      {
        market,
        vault,
        user: userATA,
        authority: nosPayer,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create close instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
