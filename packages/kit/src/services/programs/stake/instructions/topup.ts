import type { Address } from '@solana/kit';
import type { getTopupInstruction } from '@nosana/stake-program';
import * as rewardsClient from '@nosana/rewards-program';
import * as poolsClient from '@nosana/pools-program';
import type { InstructionsHelperParams } from './types.js';

export type TopupParams = {
  amount: number | bigint;
  /**
   * Pools program pool whose accrued emission is claimed into the rewards vault
   * before the topup (a pool with claim type `AddFee` and the rewards vault as
   * beneficiary). Defaults to `programs.rewardsPoolAddress` from the client config.
   */
  pool?: Address;
};

export type EnterInstruction = ReturnType<typeof rewardsClient.getEnterInstruction>;
export type ClaimFeeInstruction = ReturnType<typeof poolsClient.getClaimFeeInstruction>;
export type TopupInstruction = ReturnType<typeof getTopupInstruction>;
export type SyncInstruction = ReturnType<typeof rewardsClient.getSyncInstruction>;

// Rewards `enter` leads only when the wallet has no rewards account yet.
export type TopupInstructions =
  | [ClaimFeeInstruction, TopupInstruction, SyncInstruction]
  | [EnterInstruction, ClaimFeeInstruction, TopupInstruction, SyncInstruction];

export type CreateTopup = (params: TopupParams) => Promise<TopupInstructions>;

export async function topup(
  params: TopupParams,
  { config, deps, client, getRequiredWallet, getNosATA }: InstructionsHelperParams
): Promise<TopupInstructions> {
  try {
    const wallet = getRequiredWallet();
    const mint = config.nosTokenAddress;
    const stakeProgram = config.stakeAddress;
    const rewardsProgram = config.rewardsAddress;
    const poolsProgram = config.poolsAddress;
    const pool = params.pool ?? config.rewardsPoolAddress;
    if (!pool) {
      throw new Error(
        'No rewards pool: pass `pool` or set `programs.rewardsPoolAddress` in the client config'
      );
    }

    const [userAta, vault, stakePda, reward, reflection, rewardsVault, poolVault] =
      await Promise.all([
        getNosATA(wallet.address),
        deps.solana.pda(['vault', mint, wallet.address], stakeProgram),
        deps.solana.pda(['stake', mint, wallet.address], stakeProgram),
        deps.solana.pda(['reward', wallet.address], rewardsProgram),
        deps.solana.pda(['reflection'], rewardsProgram),
        deps.solana.pda([mint], rewardsProgram),
        deps.solana.pda(['vault', pool], poolsProgram),
      ]);

    const rewardAccount = await rewardsClient.fetchMaybeRewardAccount(deps.solana.rpc, reward);

    const claimFeeInstruction = poolsClient.getClaimFeeInstruction(
      {
        vault: poolVault,
        rewardsReflection: reflection,
        rewardsVault,
        pool,
        authority: wallet,
        rewardsProgram,
      },
      { programAddress: poolsProgram }
    );

    const topupInstruction = client.getTopupInstruction(
      {
        user: userAta,
        vault,
        stake: stakePda,
        authority: wallet,
        amount: params.amount,
      },
      { programAddress: stakeProgram }
    );

    const syncInstruction = rewardsClient.getSyncInstruction(
      { reward, stake: stakePda, reflection },
      { programAddress: rewardsProgram }
    );

    if (rewardAccount.exists) {
      return [claimFeeInstruction, topupInstruction, syncInstruction];
    }

    const enterInstruction = rewardsClient.getEnterInstruction(
      { reflection, stake: stakePda, reward, authority: wallet },
      { programAddress: rewardsProgram }
    );

    return [enterInstruction, claimFeeInstruction, topupInstruction, syncInstruction];
  } catch (err) {
    const errorMessage = `Failed to create topup instructions: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
