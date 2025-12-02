import {
  Address,
  Account,
  parseBase64RpcAccount,
  Base58EncodedBytes,
  ReadonlyUint8Array,
  address,
  TransactionSigner,
} from '@solana/kit';
import { NosanaError, ErrorCodes } from '../../../errors/NosanaError.js';
import type { ProgramDeps } from '../../../types.js';
import * as programClient from '../../../generated_clients/merkle_distributor/index.js';
import { convertBigIntToNumber, ConvertTypesForDb } from '../../../utils/index.js';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import bs58 from 'bs58';

/**
 * Claim target enum for merkle distributor.
 * Determines which address receives the claimed tokens.
 */
export enum ClaimTarget {
  YES = 'YES',
  NO = 'NO',
}

/**
 * Allowed addresses for receiving claimed tokens from merkle distributor.
 * The `to` account must be the ATA of one of these addresses.
 */
export const ALLOWED_RECEIVE_ADDRESSES = {
  [ClaimTarget.YES]: address('YessuvqUauj9yW4B3eERcyRLWmQtWpFc2ERKmaedmCE'),
  [ClaimTarget.NO]: address('NopXntmRdXhYNkoZaNTMUMShJ3aVG5RvwpiyPdd4bMh'),
} as const;

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

/**
 * Merkle distributor program interface
 */
export interface MerkleDistributorProgram {
  /**
   * Derive the ClaimStatus PDA address for a given distributor and optional claimant.
   */
  getClaimStatusPda(distributor: Address, claimant?: Address): Promise<Address>;

  /**
   * Fetch a merkle distributor account by address
   */
  get(addr: Address): Promise<MerkleDistributor>;

  /**
   * Fetch all merkle distributor accounts
   */
  all(): Promise<MerkleDistributor[]>;

  /**
   * Fetch a claim status account by address
   */
  getClaimStatus(addr: Address): Promise<ClaimStatus>;

  /**
   * Fetch claim status for a specific distributor and optional claimant.
   */
  getClaimStatusForDistributor(
    distributor: Address,
    claimant?: Address
  ): Promise<ClaimStatus | null>;

  /**
   * Fetch all claim status accounts
   */
  allClaimStatus(): Promise<ClaimStatus[]>;

  /**
   * Claim tokens from a merkle distributor.
   */
  claim(params: {
    distributor: Address;
    amountUnlocked: number | bigint;
    amountLocked: number | bigint;
    proof: Array<ReadonlyUint8Array>;
    target: ClaimTarget;
    claimant?: TransactionSigner;
  }): Promise<ReturnType<typeof programClient.getNewClaimInstruction>>;
  /**
   * Clawback tokens from a merkle distributor.
   */
  clawback(params: {
    distributor: Address;
    claimant?: TransactionSigner;
  }): Promise<ReturnType<typeof programClient.getClawbackInstruction>>;
}

/**
 * Creates a new MerkleDistributorProgram instance.
 *
 * @param deps - Program dependencies (config, logger, solana service, wallet getter)
 * @returns A MerkleDistributorProgram instance with methods to interact with the merkle distributor program
 *
 * @example
 * ```ts
 * import { createMerkleDistributorProgram } from '@nosana/kit';
 *
 * const merkleDistributor = createMerkleDistributorProgram({
 *   config,
 *   logger,
 *   solana,
 *   getWallet,
 * });
 *
 * const distributor = await merkleDistributor.get('distributor-address');
 * ```
 */
import type { ProgramConfig } from '../../../config/types.js';

export function createMerkleDistributorProgram(
  deps: ProgramDeps,
  config: ProgramConfig
): MerkleDistributorProgram {
  const programId = config.merkleDistributorAddress;
  const client = programClient;

  /**
   * Transform merkle distributor account to include address and convert BigInt to numbers
   */
  function transformMerkleDistributorAccount(
    distributorAccount: Account<programClient.MerkleDistributor>
  ): MerkleDistributor {
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
  function transformClaimStatusAccount(
    claimStatusAccount: Account<programClient.ClaimStatus>
  ): ClaimStatus {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { discriminator: _, ...claimStatusAccountData } = claimStatusAccount.data;

    return {
      address: claimStatusAccount.address,
      ...convertBigIntToNumber(claimStatusAccountData),
    };
  }

  return {
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
        const wallet = deps.getWallet();
        if (!wallet) {
          throw new Error('Wallet not set. Please set a wallet or provide a claimant address.');
        }
        claimantAddress = wallet.address;
      }

      return await deps.solana.pda(['ClaimStatus', claimantAddress, distributor], programId);
    },

    /**
     * Fetch a merkle distributor account by address
     */
    async get(addr: Address): Promise<MerkleDistributor> {
      try {
        const distributorAccount = await client.fetchMerkleDistributor(deps.solana.rpc, addr);
        const distributor = transformMerkleDistributorAccount(distributorAccount);
        return distributor;
      } catch (err) {
        deps.logger.error(`Failed to fetch merkle distributor ${err}`);
        throw err;
      }
    },

    /**
     * Fetch all merkle distributor accounts
     */
    async all(): Promise<MerkleDistributor[]> {
      try {
        const getProgramAccountsResponse = await deps.solana.rpc
          .getProgramAccounts(programId, {
            encoding: 'base64',
            filters: [
              {
                memcmp: {
                  offset: BigInt(0),
                  bytes: bs58.encode(
                    Buffer.from(client.MERKLE_DISTRIBUTOR_DISCRIMINATOR)
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
              return transformMerkleDistributorAccount(distributorAccount);
            } catch (err) {
              deps.logger.error(`Failed to decode merkle distributor ${err}`);
              return null;
            }
          })
          .filter(
            (account: MerkleDistributor | null): account is MerkleDistributor => account !== null
          );
        return distributors;
      } catch (err) {
        deps.logger.error(`Failed to fetch all merkle distributors ${err}`);
        throw err;
      }
    },

    /**
     * Fetch a claim status account by address
     */
    async getClaimStatus(addr: Address): Promise<ClaimStatus> {
      try {
        const maybeClaimStatus = await client.fetchMaybeClaimStatus(deps.solana.rpc, addr);

        // If account doesn't exist, throw a specific error
        if (!maybeClaimStatus.exists) {
          throw new ClaimStatusNotFoundError(addr);
        }

        // Transform and return the claim status
        return transformClaimStatusAccount(maybeClaimStatus);
      } catch (err) {
        deps.logger.error(`Failed to fetch claim status ${err}`);
        throw err;
      }
    },

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
        deps.logger.error(`Failed to fetch claim status ${err}`);
        throw err;
      }
    },

    /**
     * Fetch all claim status accounts
     * TODO: add filter for claimant and distributor
     */
    async allClaimStatus(): Promise<ClaimStatus[]> {
      try {
        const getProgramAccountsResponse = await deps.solana.rpc
          .getProgramAccounts(programId, {
            encoding: 'base64',
            filters: [
              {
                memcmp: {
                  offset: BigInt(0),
                  bytes: bs58.encode(
                    Buffer.from(client.CLAIM_STATUS_DISCRIMINATOR)
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
              return transformClaimStatusAccount(claimStatusAccount);
            } catch (err) {
              deps.logger.error(`Failed to decode claim status ${err}`);
              return null;
            }
          })
          .filter((account: ClaimStatus | null): account is ClaimStatus => account !== null);
        return claimStatuses;
      } catch (err) {
        deps.logger.error(`Failed to fetch all claim statuses ${err}`);
        throw err;
      }
    },

    /**
     * Claim tokens from a merkle distributor.
     * This function creates a new ClaimStatus account and claims the tokens in a single instruction.
     *
     * @param params Parameters for claiming tokens
     * @param params.claimant Optional claimant signer. If not provided, uses the wallet.
     * @returns The newClaim instruction
     * @throws NosanaError if tokens have already been claimed
     * @throws Error if wallet is not set and claimant is not provided
     */
    async claim(params: {
      distributor: Address;
      amountUnlocked: number | bigint;
      amountLocked: number | bigint;
      proof: Array<ReadonlyUint8Array>;
      target: ClaimTarget;
      claimant?: TransactionSigner;
    }): Promise<ReturnType<typeof programClient.getNewClaimInstruction>> {
      // Determine claimant signer and address
      let claimantSigner: TransactionSigner;
      let claimantAddress: Address;

      if (params.claimant) {
        claimantSigner = params.claimant;
        claimantAddress = params.claimant.address;
      } else {
        const wallet = deps.getWallet();
        if (!wallet) {
          throw new Error('Wallet not set. Please set a wallet or provide a claimant signer.');
        }
        claimantSigner = wallet;
        claimantAddress = wallet.address;
      }

      try {
        // Get the distributor account to find mint and tokenVault
        const distributorAccount = await client.fetchMerkleDistributor(
          deps.solana.rpc,
          params.distributor
        );

        // Derive ClaimStatus PDA using the claimant address
        const claimStatusPda = await this.getClaimStatusPda(params.distributor, claimantAddress);

        // Check if ClaimStatus account exists
        const maybeClaimStatus = await client.fetchMaybeClaimStatus(
          deps.solana.rpc,
          claimStatusPda
        );

        // If ClaimStatus already exists, throw an error (already claimed)
        if (maybeClaimStatus.exists) {
          throw new NosanaError(
            'Tokens have already been claimed from this distributor',
            ErrorCodes.VALIDATION_ERROR
          );
        }

        // Get the target address for receiving tokens (YES or NO)
        const targetAddress = ALLOWED_RECEIVE_ADDRESSES[params.target];

        // Find the ATA of the target address (where tokens will be sent)
        const [targetAta] = await findAssociatedTokenPda({
          mint: distributorAccount.data.mint,
          owner: targetAddress,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        programClient.getClawbackInstruction({
          distributor: params.distributor,
          from: distributorAccount.data.tokenVault,
          to: distributorAccount.data.clawbackReceiver,
          claimant: claimantSigner,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
        });

        // Create newClaim in struction which creates the account and claims the tokens
        // Note: tokens go to the ATA of the target address (YES or NO), not the claimant's ATA
        // The claimant in the instruction is the claimant signer (or wallet if not provided)
        const newClaimInstruction = programClient.getNewClaimInstruction(
          {
            distributor: params.distributor,
            claimStatus: claimStatusPda,
            from: distributorAccount.data.tokenVault,
            to: targetAta, // ATA of YES or NO address, not claimant's ATA
            claimant: claimantSigner, // Claimant signer (or wallet if not provided)
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            systemProgram: SYSTEM_PROGRAM_ADDRESS,
            amountUnlocked: params.amountUnlocked,
            amountLocked: params.amountLocked,
            proof: params.proof,
          },
          { programAddress: programId }
        );

        return newClaimInstruction;
      } catch (err) {
        deps.logger.error(`Failed to create claim instructions: ${err}`);
        throw err;
      }
    },
    /**
     * Clawback tokens from a merkle distributor.
     * This function creates a clawback instruction to transfer tokens from the distributor's token vault to the clawback receiver.
     *
     * @param params Parameters for clawback
     * @param params.distributor The address of the merkle distributor
     * @param params.claimant Optional claimant signer. If not provided, uses the wallet.
     * @returns The clawback instruction
     * @throws Error if wallet is not set and claimant is not provided
     */
    async clawback(params: {
      distributor: Address;
      claimant?: TransactionSigner; // Optional claimant signer. If not provided, uses the wallet.
    }): Promise<ReturnType<typeof programClient.getClawbackInstruction>> {
      // Determine claimant signer
      let claimantSigner: TransactionSigner;

      if (params.claimant) {
        claimantSigner = params.claimant;
      } else {
        const wallet = deps.getWallet();
        if (!wallet) {
          throw new Error('Wallet not set. Please set a wallet or provide a claimant signer.');
        }
        claimantSigner = wallet;
      }

      try {
        // Get the distributor account to find tokenVault and clawbackReceiver
        const distributorAccount = await client.fetchMerkleDistributor(
          deps.solana.rpc,
          params.distributor
        );

        // Create clawback instruction
        const clawbackInstruction = client.getClawbackInstruction(
          {
            distributor: params.distributor,
            from: distributorAccount.data.tokenVault,
            to: distributorAccount.data.clawbackReceiver,
            claimant: claimantSigner,
            tokenProgram: TOKEN_PROGRAM_ADDRESS,
            systemProgram: SYSTEM_PROGRAM_ADDRESS,
          },
          { programAddress: programId }
        );

        return clawbackInstruction;
      } catch (err) {
        deps.logger.error(`Failed to create clawback instruction: ${err}`);
        throw err;
      }
    },
  };
}
