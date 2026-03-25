import type { getStakeInstruction } from '@nosana/stake-program';
import type { InstructionsHelperParams } from './types.js';

const SECONDS_PER_DAY = 86400;

export type StakeParams = {
  amount: number | bigint;
  /** Unstake period in days */
  days: number;
};

export type StakeInstruction = ReturnType<typeof getStakeInstruction>;

export type CreateStake = (params: StakeParams) => Promise<StakeInstruction>;

export async function stake(
  { amount, days }: StakeParams,
  { config, deps, client, getRequiredWallet, getNosATA }: InstructionsHelperParams
): Promise<StakeInstruction> {
  try {
    const wallet = getRequiredWallet();
    const mint = config.nosTokenAddress;
    const programId = config.stakeAddress;
    const duration = days * SECONDS_PER_DAY;

    // Parallelize independent async operations
    const [userAta, vault, stakePda] = await Promise.all([
      getNosATA(wallet.address),
      deps.solana.pda(['vault', mint, wallet.address], programId),
      deps.solana.pda(['stake', mint, wallet.address], programId),
    ]);

    return client.getStakeInstruction({
      mint,
      user: userAta,
      vault,
      stake: stakePda,
      authority: wallet,
      amount,
      duration,
    });
  } catch (err) {
    const errorMessage = `Failed to create stake instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
