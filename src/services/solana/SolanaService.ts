import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  Address,
  getProgramDerivedAddress,
  getAddressEncoder,
  createTransactionMessage,
  signTransactionMessageWithSigners,
  partiallySignTransactionMessageWithSigners,
  getSignatureFromTransaction,
  Signature,
  Instruction,
  TransactionMessageWithBlockhashLifetime,
  setTransactionMessageFeePayer,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  sendAndConfirmTransactionFactory,
  TransactionMessageWithFeePayer,
  TransactionMessageWithLifetime,
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
  getTransactionDecoder,
  getBase64Encoder,
  getBase64EncodedWireTransaction,
  isTransactionSigner,
  TransactionPartialSigner,
  decompileTransactionMessage,
  getCompiledTransactionMessageDecoder,
} from '@solana/kit';
import {
  estimateComputeUnitLimitFactory,
  getSetComputeUnitLimitInstruction,
} from '@solana-program/compute-budget';
import {
  getCreateAssociatedTokenIdempotentInstructionAsync,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { SYSTEM_PROGRAM_ADDRESS, getTransferSolInstruction } from '@solana-program/system';
import { NosanaError, ErrorCodes } from '../../errors/NosanaError.js';
import { Logger } from '../../logger/Logger.js';
import { Wallet } from '../../types.js';
import { SolanaConfig } from '../../config/types.js';
import { convertHttpToWebSocketUrl } from '../../utils/convertHttpToWebSocketUrl.js';

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
  /**
   * Get the SOL balance for a specific address.
   *
   * @param addressStr - Optional address to query. If not provided, uses the wallet address.
   * @returns The SOL balance in lamports as a number
   * @throws {NosanaError} If neither address nor wallet is provided
   */
  getBalance(addressStr?: string | Address): Promise<number>;
  /**
   * Build a transaction message from instructions.
   * This function creates a transaction message with fee payer, blockhash, and instructions.
   *
   * @param instructions Single instruction or array of instructions
   * @param options Optional configuration
   * @param options.feePayer Optional custom fee payer. Can be a TransactionSigner (for full signing)
   *                         or an Address/string (for partial signing where feepayer signs later).
   *                         Takes precedence over service feePayer and wallet.
   * @param options.estimateComputeUnits If true, estimates and sets the compute unit limit. Default: false.
   * @returns An unsigned transaction message ready to be signed
   */
  buildTransaction(
    instructions: Instruction | Instruction[],
    options?: { feePayer?: TransactionSigner | Address | string; estimateComputeUnits?: boolean }
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
      estimateComputeUnits?: boolean;
    }
  ): Promise<Signature>;
  /**
   * Partially sign a transaction message with the signers embedded in the transaction.
   * The transaction message must already have a fee payer address set (via buildTransaction with an address).
   * Signers are extracted from instructions in the message (e.g., transfer source signer).
   * Use this when building transactions where the fee payer will sign later.
   *
   * @param transactionMessage The transaction message to sign (must have fee payer address set and signers embedded in instructions)
   * @returns A partially signed transaction
   */
  partiallySignTransaction(
    transactionMessage: TransactionMessage &
      TransactionMessageWithFeePayer &
      TransactionMessageWithBlockhashLifetime
  ): Promise<Transaction & TransactionWithBlockhashLifetime>;
  /**
   * Serialize a transaction to a base64 string.
   * Works with both partially signed and fully signed transactions.
   * Use this to transmit transactions to other parties (e.g., for fee payer signing).
   *
   * @param transaction The transaction to serialize
   * @returns Base64 encoded wire transaction string
   */
  serializeTransaction(transaction: Transaction): string;
  /**
   * Deserialize a base64 string back to a transaction.
   * Use this to receive transactions from other parties.
   *
   * Note: This method automatically restores the `lastValidBlockHeight` metadata
   * that is lost during serialization by fetching the latest blockhash from the RPC.
   *
   * @param base64 The base64 encoded transaction string
   * @returns The deserialized transaction with restored lifetime metadata
   */
  deserializeTransaction(base64: string): Promise<Transaction & TransactionWithBlockhashLifetime>;
  /**
   * Sign a transaction with the provided signers.
   * Use this when receiving a partially signed transaction that needs additional signatures.
   * This adds signatures from the provided signers to the transaction.
   *
   * @param transaction The transaction to sign (typically partially signed, received from another party)
   * @param signers Array of TransactionPartialSigners to sign with
   * @returns The signed transaction with additional signatures
   */
  signTransactionWithSigners(
    transaction: Transaction & TransactionWithBlockhashLifetime,
    signers: TransactionPartialSigner[]
  ): Promise<SendableTransaction & Transaction & TransactionWithBlockhashLifetime>;
  /**
   * Decompile a transaction back to a transaction message.
   * Use this to inspect/verify the content of a deserialized transaction before signing.
   *
   * Note: Decompilation is lossy - some information like lastValidBlockHeight may not be fully
   * reconstructed. The returned message is suitable for inspection but may not be suitable
   * for re-signing without additional context.
   *
   * @param transaction The compiled transaction to decompile
   * @returns The decompiled transaction message (with either blockhash or durable nonce lifetime)
   */
  decompileTransaction(
    transaction: Transaction
  ): BaseTransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime;
  /**
   * Get an instruction to transfer SOL from one address to another.
   *
   * @param params Transfer parameters
   * @param params.to Recipient address
   * @param params.amount Amount in lamports (number or bigint)
   * @param params.from Optional sender TransactionSigner. If not provided, uses wallet from client.
   * @returns An instruction to transfer SOL
   */
  transfer(params: {
    to: Address | string;
    amount: number | bigint;
    from?: TransactionSigner;
  }): Promise<ReturnType<typeof getTransferSolInstruction>>;
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
  ): Promise<Awaited<ReturnType<typeof getCreateAssociatedTokenIdempotentInstructionAsync>> | null>;
}

/**
 * Creates a Solana service instance.
 */
export function createSolanaService(deps: SolanaServiceDeps, config: SolanaConfig): SolanaService {
  if (!config.rpcEndpoint) {
    throw new NosanaError('RPC URL is required', ErrorCodes.INVALID_CONFIG);
  }

  const rpc = createSolanaRpc(config.rpcEndpoint);
  // Use wsEndpoint if provided, otherwise convert rpcEndpoint from http(s) to ws(s)
  const wsUrl = config.wsEndpoint ?? convertHttpToWebSocketUrl(config.rpcEndpoint);
  const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);
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

    async getBalance(addressStr?: string | Address): Promise<number> {
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
        return Number(balance.value);
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
     * - Optionally: estimated compute unit limit
     *
     * @param instructions Single instruction or array of instructions
     * @param options Optional configuration
     * @param options.feePayer Optional custom fee payer. Can be a TransactionSigner (for full signing)
     *                         or an Address/string (for partial signing where feepayer signs later).
     *                         Takes precedence over service feePayer and wallet.
     * @param options.estimateComputeUnits If true, estimates and sets the compute unit limit. Default: false.
     * @returns An unsigned transaction message ready to be signed
     */
    async buildTransaction(
      instructions: Instruction | Instruction[],
      options?: { feePayer?: TransactionSigner | Address | string; estimateComputeUnits?: boolean }
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

        // Helper to check if the feePayer is a TransactionSigner
        const isSigner = (
          value: TransactionSigner | Address | string
        ): value is TransactionSigner => typeof value === 'object' && isTransactionSigner(value);

        // Build transaction message using pipe
        // Use setTransactionMessageFeePayerSigner for TransactionSigner, setTransactionMessageFeePayer for Address
        const transactionMessage = await pipe(
          createTransactionMessage({ version: 0 }),
          (tx) => {
            if (isSigner(transactionFeePayer)) {
              return setTransactionMessageFeePayerSigner(transactionFeePayer, tx);
            } else {
              // It's a string address, convert to Address type
              const feePayerAddress = address(transactionFeePayer);
              return setTransactionMessageFeePayer(feePayerAddress, tx);
            }
          },
          (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
          (tx) => appendTransactionMessageInstructions(instructionsArray, tx),
          // Optionally estimate and set compute unit limit
          (tx) => (options?.estimateComputeUnits ? estimateAndSetComputeUnitLimit(tx) : tx)
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
     * @param options.estimateComputeUnits If true, estimates and sets the compute unit limit. Default: false.
     * @returns The transaction signature
     */
    async buildSignAndSend(
      instructions: Instruction | Instruction[],
      options?: {
        feePayer?: TransactionSigner;
        commitment?: 'processed' | 'confirmed' | 'finalized';
        estimateComputeUnits?: boolean;
      }
    ): Promise<Signature> {
      const transactionMessage = await this.buildTransaction(instructions, {
        feePayer: options?.feePayer,
        estimateComputeUnits: options?.estimateComputeUnits,
      });
      const signedTransaction = await this.signTransaction(transactionMessage);
      return await this.sendTransaction(signedTransaction, { commitment: options?.commitment });
    },

    /**
     * Get an instruction to transfer SOL from one address to another.
     *
     * @param params Transfer parameters
     * @param params.to Recipient address
     * @param params.amount Amount in lamports (number or bigint)
     * @param params.from Optional sender TransactionSigner. If not provided, uses wallet from client.
     * @returns An instruction to transfer SOL
     */
    async transfer(params: {
      to: Address | string;
      amount: number | bigint;
      from?: TransactionSigner;
    }): Promise<ReturnType<typeof getTransferSolInstruction>> {
      try {
        // Determine sender: use params.from if provided, otherwise get from wallet
        const sender = params.from ?? deps.getWallet();
        if (!sender) {
          throw new NosanaError(
            'No wallet found and no from parameter provided',
            ErrorCodes.NO_WALLET
          );
        }

        // Convert amount to bigint if it's a number
        const amountBigInt =
          typeof params.amount === 'bigint' ? params.amount : BigInt(params.amount);

        // Convert recipient to Address
        const recipient = typeof params.to === 'string' ? address(params.to) : params.to;

        deps.logger.debug(
          `Creating SOL transfer instruction: ${amountBigInt} lamports from ${sender.address} to ${recipient}`
        );

        // Create and return transfer instruction
        const instruction = getTransferSolInstruction({
          source: sender,
          destination: recipient,
          amount: amountBigInt,
        });

        return instruction;
      } catch (error) {
        if (error instanceof NosanaError) {
          throw error;
        }
        deps.logger.error(`Failed to get transfer SOL instruction: ${error}`);
        throw new NosanaError(
          'Failed to get transfer SOL instruction',
          ErrorCodes.TRANSACTION_ERROR,
          error
        );
      }
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
    ): Promise<Awaited<
      ReturnType<typeof getCreateAssociatedTokenIdempotentInstructionAsync>
    > | null> {
      try {
        // Check if the account exists
        // Use base64 encoding to avoid base58 128-byte limit error
        const accountInfo = await rpc.getAccountInfo(ata, { encoding: 'base64' }).send();
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
        throw new NosanaError('Failed to get create ATA instruction', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Partially sign a transaction message with the signers embedded in the transaction.
     * The transaction message must already have a fee payer address set (via buildTransaction with an address).
     * Signers are extracted from instructions in the message (e.g., transfer source signer).
     * Use this when building transactions where the fee payer will sign later.
     *
     * @param transactionMessage The transaction message to sign (must have fee payer address set and signers embedded in instructions)
     * @returns A partially signed transaction
     */
    async partiallySignTransaction(
      transactionMessage: TransactionMessage &
        TransactionMessageWithFeePayer &
        TransactionMessageWithBlockhashLifetime
    ): Promise<Transaction & TransactionWithBlockhashLifetime> {
      try {
        deps.logger.debug('Partially signing transaction with embedded signers');

        // Use partiallySignTransactionMessageWithSigners to sign with signers embedded in the message
        const partiallySignedTransaction =
          await partiallySignTransactionMessageWithSigners(transactionMessage);

        return partiallySignedTransaction as Transaction & TransactionWithBlockhashLifetime;
      } catch (error) {
        deps.logger.error(`Failed to partially sign transaction: ${error}`);
        throw new NosanaError(
          'Failed to partially sign transaction',
          ErrorCodes.TRANSACTION_ERROR,
          error
        );
      }
    },

    /**
     * Serialize a transaction to a base64 string.
     * Works with both partially signed and fully signed transactions.
     * Use this to transmit transactions to other parties (e.g., for fee payer signing).
     *
     * @param transaction The transaction to serialize
     * @returns Base64 encoded wire transaction string
     */
    serializeTransaction(transaction: Transaction): string {
      try {
        deps.logger.debug('Serializing transaction to base64');

        // Use getBase64EncodedWireTransaction to encode the transaction
        const base64String = getBase64EncodedWireTransaction(transaction);

        return base64String;
      } catch (error) {
        deps.logger.error(`Failed to serialize transaction: ${error}`);
        throw new NosanaError(
          'Failed to serialize transaction',
          ErrorCodes.TRANSACTION_ERROR,
          error
        );
      }
    },

    /**
     * Deserialize a base64 string back to a transaction.
     * Use this to receive transactions from other parties.
     *
     * Note: This method automatically restores the `lastValidBlockHeight` metadata
     * that is lost during serialization by fetching the latest blockhash from the RPC.
     *
     * @param base64 The base64 encoded transaction string
     * @returns The deserialized transaction with restored lifetime metadata
     */
    async deserializeTransaction(
      base64: string
    ): Promise<Transaction & TransactionWithBlockhashLifetime> {
      try {
        deps.logger.debug('Deserializing transaction from base64');

        // Decode the base64 string to bytes, then to transaction
        const transactionBytes = getBase64Encoder().encode(base64);
        let transaction = getTransactionDecoder().decode(transactionBytes);

        // Get latest blockhash info to restore lastValidBlockHeight
        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

        // Use decompileTransaction to extract the blockhash from the transaction
        const decompiled = this.decompileTransaction(transaction);

        const transactionBlockhash =
          'lifetimeConstraint' in decompiled &&
          decompiled.lifetimeConstraint &&
          'blockhash' in decompiled.lifetimeConstraint
            ? decompiled.lifetimeConstraint.blockhash
            : null;

        if (transactionBlockhash) {
          // Restore lastValidBlockHeight in the transaction's lifetime constraint
          // If blockhash matches latest, use latest's lastValidBlockHeight
          // Otherwise, use latest as fallback (transaction may still be valid)
          deps.logger.debug(
            `Restored lastValidBlockHeight: ${latestBlockhash.lastValidBlockHeight} for blockhash: ${transactionBlockhash}`
          );
          return {
            ...transaction,
            lifetimeConstraint: {
              blockhash: transactionBlockhash,
              lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            },
          };
        } else {
          throw new Error(
            'Could not determine transaction blockhash - lastValidBlockHeight not restored'
          );
        }
      } catch (error) {
        deps.logger.error(`Failed to deserialize transaction: ${error}`);
        throw new NosanaError(
          'Failed to deserialize transaction',
          ErrorCodes.TRANSACTION_ERROR,
          error
        );
      }
    },

    /**
     * Sign a transaction with the provided signers.
     * Use this when receiving a partially signed transaction that needs additional signatures.
     * This adds signatures from the provided signers to the transaction.
     *
     * @param transaction The transaction to sign (typically partially signed, received from another party)
     * @param signers Array of TransactionPartialSigners to sign with
     * @returns The signed transaction with additional signatures
     */
    async signTransactionWithSigners(
      transaction: Transaction & TransactionWithBlockhashLifetime,
      signers: TransactionPartialSigner[]
    ): Promise<SendableTransaction & Transaction & TransactionWithBlockhashLifetime> {
      try {
        deps.logger.debug(
          `Signing transaction with ${signers.length} signer(s): ${signers.map((s) => s.address).join(', ')}`
        );

        // Sign with each signer and merge signatures into the transaction
        // TransactionPartialSigner.signTransactions returns SignatureDictionary[] (not transactions)
        // We need to merge these signatures into the transaction's signatures map
        let updatedSignatures = { ...transaction.signatures };

        for (const signer of signers) {
          // signTransactions returns an array of SignatureDictionary (one per transaction)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const [signatureDict] = await signer.signTransactions([transaction as any]);
          // Merge the new signatures into our accumulated signatures
          updatedSignatures = { ...updatedSignatures, ...signatureDict };
        }

        // Create a new transaction with the merged signatures
        const signedTransaction = {
          ...transaction,
          signatures: updatedSignatures,
        };

        return signedTransaction as SendableTransaction &
          Transaction &
          TransactionWithBlockhashLifetime;
      } catch (error) {
        if (error instanceof NosanaError) {
          throw error;
        }
        deps.logger.error(`Failed to sign transaction: ${error}`);
        throw new NosanaError('Failed to sign transaction', ErrorCodes.TRANSACTION_ERROR, error);
      }
    },

    /**
     * Decompile a transaction back to a transaction message.
     * Use this to inspect/verify the content of a deserialized transaction before signing.
     *
     * Note: Decompilation is lossy - some information like lastValidBlockHeight may not be fully
     * reconstructed. The returned message is suitable for inspection but may not be suitable
     * for re-signing without additional context.
     *
     * @param transaction The compiled transaction to decompile
     * @returns The decompiled transaction message (with either blockhash or durable nonce lifetime)
     */
    decompileTransaction(
      transaction: Transaction & TransactionWithBlockhashLifetime
    ): BaseTransactionMessage & TransactionMessageWithFeePayer & TransactionMessageWithLifetime {
      try {
        deps.logger.debug('Decompiling transaction to transaction message');

        // First decode the compiled transaction message from the transaction bytes
        const compiledMessage = getCompiledTransactionMessageDecoder().decode(
          transaction.messageBytes
        );

        // Then decompile to get the transaction message
        const transactionMessage = decompileTransactionMessage(compiledMessage);

        return transactionMessage;
      } catch (error) {
        deps.logger.error(`Failed to decompile transaction: ${error}`);
        throw new NosanaError(
          'Failed to decompile transaction',
          ErrorCodes.TRANSACTION_ERROR,
          error
        );
      }
    },
  };
}
