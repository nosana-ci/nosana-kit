import { Address, Account, parseBase64RpcAccount, Base58EncodedBytes } from '@solana/kit';
import type { ProgramDeps } from '../../../types.js';
import * as programClient from '../../generated_clients/staking/index.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../../utils/index.js';
import bs58 from 'bs58';

export type Stake = ConvertTypesForDb<programClient.StakeAccountArgs> & { address: Address };

/**
 * Stake program interface
 */
export interface StakeProgram {
  /**
   * Fetch a stake account by address
   */
  get(addr: Address): Promise<Stake>;

  /**
   * Fetch multiple stake accounts by address
   */
  multiple(addresses: Address[]): Promise<Stake[]>;

  /**
   * Fetch all stake accounts
   */
  all(): Promise<Stake[]>;
}

/**
 * Creates a new StakeProgram instance.
 *
 * This function follows a functional architecture pattern, avoiding classes
 * to prevent bundle bloat and dual-package hazard issues.
 *
 * @param deps - Program dependencies (config, logger, solana service, signer getter)
 * @returns A StakeProgram instance with methods to interact with the stake program
 *
 * @example
 * ```ts
 * import { createStakeProgram } from '@nosana/kit';
 *
 * const stakeProgram = createStakeProgram({
 *   config,
 *   logger,
 *   solana,
 *   getSigner,
 * });
 *
 * const stake = await stakeProgram.get('stake-address');
 * ```
 */
export function createStakeProgram(deps: ProgramDeps): StakeProgram {
  const programId = deps.config.programs.stakeAddress;
  const client = programClient;

  /**
   * Transform stake account to include address and convert BigInt to numbers
   */
  function transformStakeAccount(stakeAccount: Account<programClient.StakeAccount>): Stake {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...stakeAccountData } = stakeAccount.data;

    return {
      address: stakeAccount.address,
      ...convertBigIntToNumber(stakeAccountData),
    };
  }

  return {
    /**
     * Fetch a stake account by address
     */
    async get(addr: Address): Promise<Stake> {
      try {
        const stakeAccount = await client.fetchStakeAccount(deps.solana.rpc, addr);
        const stake = transformStakeAccount(stakeAccount);
        return stake;
      } catch (err) {
        deps.logger.error(`Failed to fetch stake ${err}`);
        throw err;
      }
    },

    /**
     * Fetch multiple stake accounts by address
     */
    async multiple(addresses: Address[]): Promise<Stake[]> {
      try {
        const stakeAccounts = await client.fetchAllStakeAccount(deps.solana.rpc, addresses);
        const stakes = stakeAccounts.map((stakeAccount) => transformStakeAccount(stakeAccount));
        return stakes;
      } catch (err) {
        deps.logger.error(`Failed to fetch stakes ${err}`);
        throw err;
      }
    },

    /**
     * Fetch all stake accounts
     */
    async all(): Promise<Stake[]> {
      try {
        const getProgramAccountsResponse = await deps.solana.rpc
          .getProgramAccounts(programId, {
            encoding: 'base64',
            filters: [
              {
                memcmp: {
                  offset: BigInt(0),
                  bytes: bs58.encode(
                    Buffer.from(client.STAKE_ACCOUNT_DISCRIMINATOR)
                  ) as Base58EncodedBytes,
                  encoding: 'base58',
                },
              },
            ],
          })
          .send();

        const stakes: Stake[] = getProgramAccountsResponse
          .map((result: { pubkey: Address; account: unknown }) => {
            try {
              const stakeAccount = programClient.decodeStakeAccount(
                parseBase64RpcAccount(result.pubkey, result.account as never)
              );
              return transformStakeAccount(stakeAccount);
            } catch (err) {
              deps.logger.error(`Failed to decode stake ${err}`);
              return null;
            }
          })
          .filter((account: Stake | null): account is Stake => account !== null);
        return stakes;
      } catch (err) {
        deps.logger.error(`Failed to fetch all stakes ${err}`);
        throw err;
      }
    },
  };
}
