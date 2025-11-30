import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  Address,
  getProgramDerivedAddress,
  getAddressEncoder,
  createTransactionMessage,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  Signature,
  Instruction,
  TransactionMessageWithBlockhashLifetime,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  sendAndConfirmTransactionFactory,
  TransactionMessageWithFeePayer,
  TransactionMessage,
  SendableTransaction,
  Transaction,
  appendTransactionMessageInstructions,
  BaseTransactionMessage,
  pipe,
  assertIsSendableTransaction,
  TransactionSigner,
  Commitment,
  TransactionWithBlockhashLifetime,
} from '@solana/kit';
import {
  estimateComputeUnitLimitFactory,
  getSetComputeUnitLimitInstruction,
} from '@solana-program/compute-budget';
import {
  getCreateAssociatedTokenIdempotentInstructionAsync,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';
import { Logger } from '../logger/Logger.js';
import { Wallet } from '../types.js';
import { SolanaConfig } from '../config/types.js';

/**
 * Factory function to create an estimateAndSetComputeUnitLimit function
 * that estimates compute units and adds the set compute unit limit instruction
 */
function estimateAndSetComputeUnitLimitFactory(
  ...params: Parameters<typeof estimateComputeUnitLimitFactory>
) {
  const estimateComputeUnitLimit = estimateComputeUnitLimitFactory(...params);
  return async <T extends BaseTransactionMessage & TransactionMessageWithFeePayer>(
    transactionMessage: T
  ) => {
    const computeUnitsEstimate = await estimateComputeUnitLimit(transactionMessage);
    return appendTransactionMessageInstructions(
      [getSetComputeUnitLimitInstruction({ units: computeUnitsEstimate })],
      transactionMessage
    );
  };
}

/**
 * Dependencies for SolanaService
 */
export interface SolanaServiceDeps {
  logger: Logger;
  getWallet: () => Wallet | undefined;
}

/**
 * Solana service interface
 */
export interface SolanaService {
  readonly config: SolanaConfig;
  readonly rpc: ReturnType<typeof createSolanaRpc>;
  readonly rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  readonly sendAndConfirmTransaction: ReturnType<typeof sendAndConfirmTransactionFactory>;
  readonly estimateAndSetComputeUnitLimit: ReturnType<typeof estimateAndSetComputeUnitLimitFactory>;
  /**
   * Optional fee payer for transactions. If set, will be used as fallback when no feePayer is provided in options.
   * Set this property directly to configure the fee payer.
   */
  feePayer: TransactionSigner | undefined;
  pda(seeds: Array<Address | string>, programId: Address): Promise<Address>;
  getBalance(addressStr?: string | Address): Promise<bigint>;
  buildTransaction(
    instructions: Instruction | Instruction[],
    options?: { feePayer?: TransactionSigner }
  ): Promise<
    TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime
  >;
  signTransaction(
    transactionMessage: TransactionMessage &
      TransactionMessageWithFeePayer &
      TransactionMessageWithBlockhashLifetime
  ): Promise<SendableTransaction & Transaction & TransactionWithBlockhashLifetime>;
  sendTransaction(
    transaction: SendableTransaction & Transaction & TransactionWithBlockhashLifetime,
    options?: { commitment?: 'processed' | 'confirmed' | 'finalized' }
  ): Promise<Signature>;
  buildSignAndSend(
    instructions: Instruction | Instruction[],
    options?: {
      feePayer?: TransactionSigner;
      commitment?: 'processed' | 'confirmed' | 'finalized';
    }
  ): Promise<Signature>;
  /**
   * Get an instruction to create an associated token account if it doesn't exist.
   * Checks if the ATA exists, and if not, returns an instruction to create it.
   * Uses the idempotent version so it's safe to call even if the account already exists.
   *
   * @param ata The associated token account address
   * @param mint The token mint address
   * @param owner The owner of the associated token account
   * @param payer Optional payer for the account creation. If not provided, uses the wallet or service feePayer.
   * @returns An instruction to create the ATA if it doesn't exist, or null if it already exists
   */
  getCreateATAInstructionIfNeeded(
    ata: Address,
    mint: Address,
    owner: Address,
    payer?: TransactionSigner
  ): Promise<Instruction | null>;
}

/**
 * Creates a Solana service instance.
 */
export function createSolanaService(deps: SolanaServiceDeps, config: SolanaConfig): SolanaService {
  if (!config.rpcEndpoint) {
    throw new NosanaError('RPC URL is required', ErrorCodes.INVALID_CONFIG);
  }

  const rpc = createSolanaRpc(config.rpcEndpoint);
  // Use wsEndpoint if provided, otherwise fall back to rpcEndpoint
  const rpcSubscriptions = createSolanaRpcSubscriptions(config.wsEndpoint ?? config.rpcEndpoint);
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  // Create a function to estimate and set the compute unit limit
  const estimateAndSetComputeUnitLimit = estimateAndSetComputeUnitLimitFactory({ rpc });

  // Store feePayer in a mutable variable, initialized from config
  let feePayer: TransactionSigner | undefined = config.feePayer;

  return {
    config,
    rpc,
    rpcSubscriptions,
    sendAndConfirmTransaction,
    estimateAndSetComputeUnitLimit,
    get feePayer() {
      return feePayer;
    },
    set feePayer(value: TransactionSigner | undefined) {
      feePayer = value;
    },

    async pda(seeds: Array<Address | string>, programId: Address): Promise<Address> {
      const addressEncoder = getAddressEncoder();
      const [pda] = await getProgramDerivedAddress({
        programAddress: programId,
        seeds: seeds.map((seed) => {
          // Address is a branded string type, so typeof will return 'string'
          // We need to encode Address types to bytes for PDA seeds
          // Try to encode if it looks like an address (base58, 32-44 chars), otherwise pass as-is
          if (typeof seed === 'string') {
            // Check if it's likely an address (base58 encoded addresses are 32-44 chars)
            // Short strings like 'ClaimStatus' should be passed as-is
            if (seed.length >= 32 && seed.length <= 44) {
              try {
                // Try to encode as Address - if it's a valid address, this will work
                return addressEncoder.encode(seed as Address);
              } catch {
                // If encoding fails, it's not a valid address, pass as-is (e.g., 'ClaimStatus')
                return seed;
              }
            }
            // Short strings pass as-is
            return seed;
          }
          // Non-string types should be encoded
          return addressEncoder.encode(seed);
        }),
      });
      return pda;
    },

    async getBalance(addressStr?: string | Address): Promise<bigint> {
      try {
        // Use wallet address if no address is provided
        let addr: Address;
        if (addressStr) {
          addr = address(addressStr);
        } else {
          const wallet = deps.getWallet();
          if (!wallet) {
            throw new NosanaError('No wallet found and no address provided', ErrorCodes.NO_WALLET);
          }
          addr = wallet.address;
        }

        deps.logger.debug(`Getting balance for address: ${addr}`);
        const balance = await rpc.getBalance(addr).send();
        return balance.value;
      } catch (error) {
        if (error instanceof NosanaError) {
          throw error;
        }
        deps.logger.error(`Failed to get balance: ${error}`);
        throw new NosanaError('Failed to get balance', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Build a transaction message from instructions
     * This function creates a transaction message with:
     * - Fee payer set to the provided feePayer, service feePayer, or wallet (in that order)
     * - Latest blockhash for lifetime
     * - Provided instructions
     * - Estimated compute unit limit
     *
     * @param instructions Single instruction or array of instructions
     * @param options Optional configuration
     * @param options.feePayer Optional custom fee payer. Takes precedence over service feePayer and wallet.
     * @returns An unsigned transaction message ready to be signed
     */
    async buildTransaction(
      instructions: Instruction | Instruction[],
      options?: { feePayer?: TransactionSigner }
    ): Promise<
      TransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithBlockhashLifetime
    > {
      // Priority: options.feePayer > service.feePayer > wallet
      const transactionFeePayer = options?.feePayer ?? feePayer ?? deps.getWallet();
      if (!transactionFeePayer) {
        throw new NosanaError('No wallet found and no feePayer provided', ErrorCodes.NO_WALLET);
      }

      try {
        // Get latest blockhash
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        // Normalize instructions to array
        const instructionsArray = Array.isArray(instructions) ? instructions : [instructions];

        // Build transaction message using pipe
        const transactionMessage = await pipe(
          createTransactionMessage({ version: 0 }),
          (tx) => setTransactionMessageFeePayerSigner(transactionFeePayer, tx),
          (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
          (tx) => appendTransactionMessageInstructions(instructionsArray, tx),
          (tx) => estimateAndSetComputeUnitLimit(tx)
        );

        return transactionMessage;
      } catch (error) {
        deps.logger.error(`Failed to build transaction: ${error}`);
        throw new NosanaError('Failed to build transaction', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Sign a transaction message
     * This function signs the transaction message using the signers embedded in the message.
     * The transaction message should already contain the signers (e.g., from buildTransaction).
     *
     * @param transactionMessage The transaction message to sign (must contain signers)
     * @returns A signed transaction
     */
    async signTransaction(
      transactionMessage: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithBlockhashLifetime
    ): Promise<SendableTransaction & Transaction & TransactionWithBlockhashLifetime> {
      try {
        // Sign the transaction message using signers embedded in the message
        const transaction = await signTransactionMessageWithSigners(transactionMessage);

        return transaction as SendableTransaction & Transaction & TransactionWithBlockhashLifetime;
      } catch (error) {
        deps.logger.error(`Failed to sign transaction: ${error}`);
        throw new NosanaError('Failed to sign transaction', ErrorCodes.TRANSACTION_ERROR, error);
      }
    },

    /**
     * Send and confirm a signed transaction
     * This function validates that the transaction is sendable, then sends it and waits for confirmation.
     *
     * @param transaction The signed transaction to send
     * @param options Optional configuration (same as sendAndConfirmTransaction)
     * @param options.commitment Commitment level for confirmation (takes precedence over config, then falls back to config.commitment, then 'confirmed')
     * @returns The transaction signature
     */
    async sendTransaction(
      transaction: SendableTransaction & Transaction & TransactionWithBlockhashLifetime,
      options?: { commitment?: Commitment }
    ): Promise<Signature> {
      try {
        // Ensure the transaction is sendable before attempting to send
        assertIsSendableTransaction(transaction);

        // Get the transaction signature for logging
        const signature = getSignatureFromTransaction(transaction);

        deps.logger.info(`Sending transaction: ${signature}`);

        // Send and confirm the transaction with optional commitment level
        // Priority: options.commitment > config.commitment > 'confirmed'
        const commitment = options?.commitment ?? config.commitment ?? 'confirmed';
        await sendAndConfirmTransaction(transaction, { commitment });

        deps.logger.info(`Transaction ${signature} confirmed!`);

        return signature;
      } catch (error) {
        const errorMessage = `Failed to send transaction: ${error instanceof Error ? error.message : String(error)}`;
        deps.logger.error(errorMessage);
        throw new NosanaError(errorMessage, ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Build, sign, and send a transaction in one call
     * This is a convenience function that combines buildTransaction, signTransaction, and sendTransaction.
     * Use this when you want to build, sign, and send in a single operation.
     *
     * @param instructions Single instruction or array of instructions
     * @param options Optional configuration
     * @param options.feePayer Optional custom fee payer. If not provided, uses the wallet.
     * @param options.commitment Commitment level for confirmation (takes precedence over config, then falls back to config.commitment, then 'confirmed')
     * @returns The transaction signature
     */
    async buildSignAndSend(
      instructions: Instruction | Instruction[],
      options?: {
        feePayer?: TransactionSigner;
        commitment?: 'processed' | 'confirmed' | 'finalized';
      }
    ): Promise<Signature> {
      const transactionMessage = await this.buildTransaction(instructions, {
        feePayer: options?.feePayer,
      });
      const signedTransaction = await this.signTransaction(transactionMessage);
      return await this.sendTransaction(signedTransaction, { commitment: options?.commitment });
    },

    /**
     * Get an instruction to create an associated token account if it doesn't exist.
     * Checks if the ATA exists, and if not, returns an instruction to create it.
     * Uses the idempotent version so it's safe to call even if the account already exists.
     *
     * @param ata The associated token account address
     * @param mint The token mint address
     * @param owner The owner of the associated token account
     * @param payer Optional payer for the account creation. If not provided, uses the wallet or service feePayer.
     * @returns An instruction to create the ATA if it doesn't exist, or null if it already exists
     */
    async getCreateATAInstructionIfNeeded(
      ata: Address,
      mint: Address,
      owner: Address,
      payer?: TransactionSigner
    ): Promise<Instruction | null> {
      try {
        // Check if the account exists
        const accountInfo = await rpc.getAccountInfo(ata).send();
        if (accountInfo.value !== null) {
          // Account already exists
          return null;
        }

        // Account doesn't exist, create instruction
        // Priority: provided payer > service feePayer > wallet
        const instructionPayer = payer ?? feePayer ?? deps.getWallet();
        if (!instructionPayer) {
          throw new NosanaError(
            'No payer found for creating associated token account',
            ErrorCodes.NO_WALLET
          );
        }

        const instruction = await getCreateAssociatedTokenIdempotentInstructionAsync({
          payer: instructionPayer,
          ata,
          owner,
          mint,
          systemProgram: SYSTEM_PROGRAM_ADDRESS,
          tokenProgram: TOKEN_PROGRAM_ADDRESS,
        });

        return instruction;
      } catch (error) {
        deps.logger.error(`Failed to get create ATA instruction: ${error}`);
        throw new NosanaError(
          'Failed to get create ATA instruction',
          ErrorCodes.RPC_ERROR,
          error
        );
      }
    },
  };
}
