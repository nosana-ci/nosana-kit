import type { Address, Account } from '@solana/kit';
import * as programClient from '@nosana/rewards-program';
import type { ProgramDeps, Wallet } from '../../../types.js';
import { NosanaError, ErrorCodes } from '../../../errors/NosanaError.js';
import { convertBigIntToNumber, type ConvertTypesForDb } from '../../../utils/index.js';
import type { ProgramConfig } from '../../../config/types.js';

/**
 * A wallet's rewards account, as the rewards program keeps it.
 * @group @nosana/kit
 */
export type Reward = ConvertTypesForDb<programClient.RewardAccountArgs> & { address: Address };

export type EnterInstruction = ReturnType<typeof programClient.getEnterInstruction>;

/**
 * Rewards program interface: the staking rewards a wallet's stake earns.
 * @group @nosana/kit
 */
export interface RewardsProgram {
  /**
   * The rewards `enter` for the wallet's stake, which makes its rewards
   * account. One already there can't be entered again: send it when
   * {@link find} answers none.
   */
  enter(): Promise<EnterInstruction>;

  /**
   * Derive the rewards account PDA address for a given owner (defaults to wallet address)
   */
  getAddress(owner?: Address): Promise<Address>;

  /**
   * The program's reflection account address
   */
  getReflectionAddress(): Promise<Address>;

  /**
   * Fetch a rewards account by address
   */
  get(addr: Address): Promise<Reward>;

  /**
   * Fetch a rewards account by owner address (defaults to wallet address);
   * undefined when the owner has none
   */
  find(owner?: Address): Promise<Reward | undefined>;
}

/**
 * Creates a new RewardsProgram instance.
 *
 * @param deps - Program dependencies (logger, solana service, wallet getter)
 * @param config - The program addresses
 * @returns A RewardsProgram instance with methods to interact with the rewards program
 */
export function createRewardsProgram(deps: ProgramDeps, config: ProgramConfig): RewardsProgram {
  const programId = config.rewardsAddress;
  const client = programClient;

  /**
   * Transform rewards account to include address and convert BigInt to numbers
   */
  function transformRewardAccount(rewardAccount: Account<programClient.RewardAccount>): Reward {
    const { discriminator: _, ...rewardAccountData } = rewardAccount.data;

    return {
      address: rewardAccount.address,
      ...convertBigIntToNumber(rewardAccountData),
    };
  }

  function getRequiredWallet(): Wallet {
    const wallet = deps.getWallet();
    if (!wallet) {
      throw new NosanaError('Wallet is required for this operation', ErrorCodes.NO_WALLET);
    }
    return wallet;
  }

  return {
    async enter() {
      const wallet = getRequiredWallet();
      const [reflection, stake, reward] = await Promise.all([
        this.getReflectionAddress(),
        deps.solana.pda(['stake', config.nosTokenAddress, wallet.address], config.stakeAddress),
        this.getAddress(wallet.address),
      ]);
      return client.getEnterInstruction(
        { reflection, stake, reward, authority: wallet },
        { programAddress: programId }
      );
    },

    async getAddress(owner?: Address): Promise<Address> {
      const resolvedOwner = owner ?? getRequiredWallet().address;
      return deps.solana.pda(['reward', resolvedOwner], programId);
    },

    async getReflectionAddress(): Promise<Address> {
      return deps.solana.pda(['reflection'], programId);
    },

    async get(addr: Address): Promise<Reward> {
      try {
        return transformRewardAccount(await client.fetchRewardAccount(deps.solana.rpc, addr));
      } catch (err) {
        deps.logger.error(`Failed to fetch reward ${err}`);
        throw err;
      }
    },

    async find(owner?: Address): Promise<Reward | undefined> {
      const addr = await this.getAddress(owner);
      const account = await client.fetchMaybeRewardAccount(deps.solana.rpc, addr);
      return account.exists ? transformRewardAccount(account) : undefined;
    },
  };
}
