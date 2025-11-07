import { BaseProgram } from './BaseProgram.js';
import {
  Address,
  Account,
  parseBase64RpcAccount,
  Base58EncodedBytes,
  ReadonlyUint8Array,
} from 'gill';
import { SYSVAR_CLOCK_ADDRESS } from '@solana/sysvars';
import { NosanaClient, NosanaError, ErrorCodes } from '../index.js';
import * as programClient from '../generated_clients/merkle_distributor/index.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../utils/index.js';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import bs58 from 'bs58';
import { SYSTEM_PROGRAM_ADDRESS } from 'gill/programs';

export type MerkleDistributor = ConvertTypesForDb<programClient.MerkleDistributorArgs> & {
  address: Address;
};

export type ClaimStatus = ConvertTypesForDb<programClient.ClaimStatusArgs> & {
  address: Address;
};

/**
 * Error thrown when a claim status account is not found
 */
export class ClaimStatusNotFoundError extends Error {
  constructor(address: Address) {
    super(`Claim status account not found at address ${address}`);
    this.name = 'ClaimStatusNotFoundError';
  }
}

export class MerkleDistributorProgram extends BaseProgram {
  public readonly client: typeof programClient;

  constructor(sdk: NosanaClient) {
    super(sdk);
    this.client = programClient;
  }

  protected getProgramId(): Address {
    return this.sdk.config.programs.merkleDistributorAddress;
  }

  /**
   * Derive the ClaimStatus PDA address for a given distributor and optional claimant.
   * If claimant is not provided, uses the wallet's address.
   *
   * @param distributor The address of the merkle distributor
   * @param claimant Optional claimant address. If not provided, uses the wallet's address.
   * @returns The ClaimStatus PDA address
   * @throws Error if wallet is not set and claimant is not provided
   */
  async getClaimStatusPda(distributor: Address, claimant?: Address): Promise<Address> {
    let claimantAddress: Address;

    if (claimant) {
      claimantAddress = claimant;
    } else {
      if (!this.sdk.wallet) {
        throw new Error('Wallet not set. Please set a wallet or provide a claimant address.');
      }
      claimantAddress = this.sdk.wallet.address;
    }

    return await this.sdk.solana.pda(
      ['ClaimStatus', claimantAddress, distributor],
      this.getProgramId()
    );
  }

  /**
   * Fetch a merkle distributor account by address
   */
  async get(addr: Address): Promise<MerkleDistributor> {
    try {
      const distributorAccount = await this.client.fetchMerkleDistributor(
        this.sdk.solana.rpc,
        addr
      );
      const distributor = this.transformMerkleDistributorAccount(distributorAccount);
      return distributor;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch merkle distributor ${err}`);
      throw err;
    }
  }

  /**
   * Fetch all merkle distributor accounts
   */
  async all(): Promise<MerkleDistributor[]> {
    try {
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(
                  Buffer.from(this.client.MERKLE_DISTRIBUTOR_DISCRIMINATOR)
                ) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
        })
        .send();

      const distributors: MerkleDistributor[] = getProgramAccountsResponse
        .map((result: { pubkey: Address; account: unknown }) => {
          try {
            const distributorAccount = programClient.decodeMerkleDistributor(
              parseBase64RpcAccount(result.pubkey, result.account as never)
            );
            return this.transformMerkleDistributorAccount(distributorAccount);
          } catch (err) {
            this.sdk.logger.error(`Failed to decode merkle distributor ${err}`);
            return null;
          }
        })
        .filter(
          (account: MerkleDistributor | null): account is MerkleDistributor => account !== null
        );
      return distributors;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all merkle distributors ${err}`);
      throw err;
    }
  }

  /**
   * Fetch a claim status account by address
   */
  async getClaimStatus(addr: Address): Promise<ClaimStatus> {
    try {
      const maybeClaimStatus = await this.client.fetchMaybeClaimStatus(this.sdk.solana.rpc, addr);

      // If account doesn't exist, throw a specific error
      if (!maybeClaimStatus.exists) {
        throw new ClaimStatusNotFoundError(addr);
      }

      // Transform and return the claim status
      return this.transformClaimStatusAccount(maybeClaimStatus);
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch claim status ${err}`);
      throw err;
    }
  }

  /**
   * Fetch claim status for a specific distributor and optional claimant.
   * Derives the ClaimStatus PDA using the claimant address (or wallet's address if not provided) and the distributor address.
   *
   * @param distributor The address of the merkle distributor
   * @param claimant Optional claimant address. If not provided, uses the wallet's address.
   * @returns The claim status if it exists, null otherwise
   * @throws Error if wallet is not set and claimant is not provided
   */
  async getClaimStatusForDistributor(
    distributor: Address,
    claimant?: Address
  ): Promise<ClaimStatus | null> {
    try {
      // Derive ClaimStatus PDA
      const claimStatusPda = await this.getClaimStatusPda(distributor, claimant);

      // Reuse getClaimStatus to fetch and transform the claim status
      // If the account doesn't exist, it will throw, so we catch and return null
      return await this.getClaimStatus(claimStatusPda);
    } catch (err) {
      // If the account doesn't exist, return null instead of throwing
      // Check if it's the specific ClaimStatusNotFoundError from getClaimStatus
      if (err instanceof ClaimStatusNotFoundError) {
        return null;
      }
      // For other errors, log and rethrow
      this.sdk.logger.error(`Failed to fetch claim status ${err}`);
      throw err;
    }
  }

  /**
   * Fetch all claim status accounts
   * TODO: add filter for claimant and distributor
   */
  async allClaimStatus(): Promise<ClaimStatus[]> {
    try {
      const getProgramAccountsResponse = await this.sdk.solana.rpc
        .getProgramAccounts(this.getProgramId(), {
          encoding: 'base64',
          filters: [
            {
              memcmp: {
                offset: BigInt(0),
                bytes: bs58.encode(
                  Buffer.from(this.client.CLAIM_STATUS_DISCRIMINATOR)
                ) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
        })
        .send();

      const claimStatuses: ClaimStatus[] = getProgramAccountsResponse
        .map((result: { pubkey: Address; account: unknown }) => {
          try {
            const claimStatusAccount = programClient.decodeClaimStatus(
              parseBase64RpcAccount(result.pubkey, result.account as never)
            );
            return this.transformClaimStatusAccount(claimStatusAccount);
          } catch (err) {
            this.sdk.logger.error(`Failed to decode claim status ${err}`);
            return null;
          }
        })
        .filter((account: ClaimStatus | null): account is ClaimStatus => account !== null);
      return claimStatuses;
    } catch (err) {
      this.sdk.logger.error(`Failed to fetch all claim statuses ${err}`);
      throw err;
    }
  }

  /**
   * Transform merkle distributor account to include address and convert BigInt to numbers
   */
  public transformMerkleDistributorAccount(
    distributorAccount: Account<programClient.MerkleDistributor>
  ): MerkleDistributor {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      discriminator: _,
      root,
      buffer0,
      buffer1,
      buffer2,
      ...distributorAccountData
    } = distributorAccount.data;

    const converted = convertBigIntToNumber(distributorAccountData);
    return {
      address: distributorAccount.address,
      ...converted,
      root: bs58.encode(Buffer.from(root)),
      buffer0: bs58.encode(Buffer.from(buffer0)),
      buffer1: bs58.encode(Buffer.from(buffer1)),
      buffer2: bs58.encode(Buffer.from(buffer2)),
    };
  }

  /**
   * Transform claim status account to include address and convert BigInt to numbers
   */
  public transformClaimStatusAccount(
    claimStatusAccount: Account<programClient.ClaimStatus>
  ): ClaimStatus {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...claimStatusAccountData } = claimStatusAccount.data;

    return {
      address: claimStatusAccount.address,
      ...convertBigIntToNumber(claimStatusAccountData),
    };
  }

  /**
   * Claim tokens from a merkle distributor.
   * This function creates a new ClaimStatus account and claims the tokens in a single instruction.
   *
   * @param params Parameters for claiming tokens
   * @returns The newClaim instruction
   * @throws NosanaError if tokens have already been claimed
   */
  async claim(params: {
    distributor: Address;
    amountUnlocked: number | bigint;
    amountLocked: number | bigint;
    proof: Array<ReadonlyUint8Array>;
    transferHookProgram?: Address;
  }): Promise<ReturnType<typeof programClient.getNewClaimInstruction>> {
    if (!this.sdk.wallet) {
      throw new Error('Wallet not set. Please set a wallet before claiming tokens.');
    }

    try {
      const claimant = this.sdk.wallet.address;

      // Get the distributor account to find mint and tokenVault
      const distributorAccount = await this.client.fetchMerkleDistributor(
        this.sdk.solana.rpc,
        params.distributor
      );

      // Derive ClaimStatus PDA
      const claimStatusPda = await this.getClaimStatusPda(params.distributor);

      // Check if ClaimStatus account exists
      const maybeClaimStatus = await this.client.fetchMaybeClaimStatus(
        this.sdk.solana.rpc,
        claimStatusPda
      );

      // If ClaimStatus already exists, throw an error (already claimed)
      if (maybeClaimStatus.exists) {
        throw new NosanaError(
          'Tokens have already been claimed from this distributor',
          ErrorCodes.VALIDATION_ERROR
        );
      }

      // Find claimant's associated token account
      const [claimantAta] = await findAssociatedTokenPda({
        mint: distributorAccount.data.mint,
        owner: claimant,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });

      // Transfer hook program - use provided or default to token program
      const transferHookProgram = params.transferHookProgram || TOKEN_PROGRAM_ADDRESS;

      // Create newClaim instruction which creates the account and claims the tokens
      const newClaimInstruction = programClient.getNewClaimInstruction(
        {
          distributor: params.distributor,
          claimStatus: claimStatusPda,
          from: distributorAccount.data.tokenVault,
          to: claimantAta,
          claimant: this.sdk.wallet,
          transferHookProgram: transferHookProgram,
          mint: distributorAccount.data.mint,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
          clock: SYSVAR_CLOCK_ADDRESS,
          amountUnlocked: params.amountUnlocked,
          amountLocked: params.amountLocked,
          proof: params.proof,
        },
        { programAddress: this.getProgramId() }
      );

      return newClaimInstruction;
    } catch (err) {
      this.sdk.logger.error(`Failed to create claim instructions: ${err}`);
      throw err;
    }
  }
}
