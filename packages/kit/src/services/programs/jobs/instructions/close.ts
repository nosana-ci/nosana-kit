import type { Address, TransactionSigner } from '@solana/kit';
import type { getCloseInstruction } from '@nosana/jobs-program';
import type { InstructionsHelperParams } from './types.js';
import { getMarketSettingsPda } from './projectAccess.js';

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

    // Get jobs program address, user ATA, and derive the vault and settings PDAs
    const [{ jobsProgram }, userATA] = await Promise.all([
      getStaticAccounts(),
      getNosATA(nosPayer.address),
    ]);
    const [vault, marketSettings] = await Promise.all([
      deps.solana.pda([market, config.nosTokenAddress], jobsProgram),
      getMarketSettingsPda(deps, market, jobsProgram),
    ]);

    // Create the close instruction, the settings account is closed with the market when it exists
    return client.getCloseInstruction(
      {
        market,
        vault,
        user: userATA,
        authority: nosPayer,
        marketSettings,
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
