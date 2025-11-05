import { BaseProgram } from './BaseProgram.js';
import { Address, Account, parseBase64RpcAccount, Base58EncodedBytes } from 'gill';
import { NosanaClient } from '../index.js';
import * as programClient from '../generated_clients/staking/index.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../utils/index.js';
import bs58 from 'bs58';

export type Stake = ConvertTypesForDb<programClient.StakeAccountArgs> & { address: Address };

export class StakeProgram extends BaseProgram {
  public readonly client: typeof programClient;

  constructor(sdk: NosanaClient) {
    super(sdk);
    this.client = programClient;
  }

  protected getProgramId(): Address {
    return this.sdk.config.programs.stakeAddress;
  }

  /**
   * Fetch a stake account by address
   */
  async get(addr: Address): Promise<Stake> {
    try {
      const stakeAccount = await this.client.fetchStakeAccount(this.sdk.solana.rpc, addr);
      const stake = this.transformStakeAccount(stakeAccount);
      return stake;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch stake ${err}`);
      throw err;
    }
  }

  /**
   * Fetch multiple stake accounts by address
   */
  async multiple(addresses: Address[]): Promise<Stake[]> {
    try {
      const stakeAccounts = await this.client.fetchAllStakeAccount(this.sdk.solana.rpc, addresses);
      const stakes = stakeAccounts.map((stakeAccount) => this.transformStakeAccount(stakeAccount));
      return stakes;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch stakes ${err}`);
      throw err;
    }
  }

  /**
   * Fetch all stake accounts
   */
  async all(): Promise<Stake[]> {
    try {
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(
                  Buffer.from(this.client.STAKE_ACCOUNT_DISCRIMINATOR)
                ) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
        })
        .send();

      const stakes: Stake[] = getProgramAccountsResponse
        .map((result: any) => {
          try {
            const stakeAccount = programClient.decodeStakeAccount(
              parseBase64RpcAccount(result.pubkey, result.account)
            );
            return this.transformStakeAccount(stakeAccount);
          } catch (err) {
            this.sdk.logger.error(`Failed to decode stake ${err}`);
            return null;
          }
        })
        .filter((account: Stake | null): account is Stake => account !== null);
      return stakes;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all stakes ${err}`);
      throw err;
    }
  }

  /**
   * Transform stake account to include address and convert BigInt to numbers
   */
  public transformStakeAccount(stakeAccount: Account<programClient.StakeAccount>): Stake {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...stakeAccountData } = stakeAccount.data;

    return {
      address: stakeAccount.address,
      ...convertBigIntToNumber(stakeAccountData),
    };
  }
}
