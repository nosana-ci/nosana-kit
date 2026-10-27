import type { Address } from '@solana/kit';
import type { getCloseSettingsInstruction } from '@nosana/jobs-program';
import type { InstructionsHelperParams } from './types.js';
import { getMarketSettingsPda } from './projectAccess.js';

export type CloseMarketSettingsParams = {
  market: Address;
};

export type CloseMarketSettingsInstruction = ReturnType<typeof getCloseSettingsInstruction>;

export type CloseMarketSettings = (
  params: CloseMarketSettingsParams
) => Promise<CloseMarketSettingsInstruction>;

export async function closeMarketSettings(
  { market }: CloseMarketSettingsParams,
  { deps, client, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<CloseMarketSettingsInstruction> {
  try {
    const wallet = getRequiredWallet();
    const { jobsProgram } = await getStaticAccounts();
    const marketSettings = await getMarketSettingsPda(deps, market, jobsProgram);

    // Create the close settings instruction, the market is open to all projects afterwards
    return client.getCloseSettingsInstruction(
      {
        market,
        marketSettings,
        authority: wallet,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create close settings instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
