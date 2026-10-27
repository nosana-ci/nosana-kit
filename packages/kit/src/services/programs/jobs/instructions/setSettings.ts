import type { Address } from '@solana/kit';
import type { getSetSettingsInstruction } from '@nosana/jobs-program';
import type { InstructionsHelperParams } from './types.js';
import { getMarketSettingsPda } from './projectAccess.js';

export type SetMarketSettingsParams = {
  market: Address;
  /** NFT collection whose holders may post jobs to the market */
  projectAccessKey: Address;
};

export type SetMarketSettingsInstruction = ReturnType<typeof getSetSettingsInstruction>;

export type SetMarketSettings = (
  params: SetMarketSettingsParams
) => Promise<SetMarketSettingsInstruction>;

export async function setMarketSettings(
  { market, projectAccessKey }: SetMarketSettingsParams,
  { deps, client, getRequiredWallet, getStaticAccounts }: InstructionsHelperParams
): Promise<SetMarketSettingsInstruction> {
  try {
    const wallet = getRequiredWallet();
    const { jobsProgram } = await getStaticAccounts();
    const marketSettings = await getMarketSettingsPda(deps, market, jobsProgram);

    // Create the set settings instruction, the settings account is created when needed
    return client.getSetSettingsInstruction(
      {
        market,
        marketSettings,
        projectAccessKey,
        authority: wallet,
      },
      {
        programAddress: jobsProgram,
      }
    );
  } catch (err) {
    const errorMessage = `Failed to create set settings instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
