import {
  createSolanaClient,
  address,
  Address,
  SolanaClient,
  getProgramDerivedAddress,
  getAddressEncoder,
  createTransaction,
  signTransactionMessageWithSigners,
  getExplorerLink,
  getSignatureFromTransaction,
  Signature,
  IInstruction,
  TransactionMessageWithBlockhashLifetime,
  CompilableTransactionMessage,
  FullySignedTransaction,
  TransactionWithBlockhashLifetime,
} from 'gill';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';
import { NosanaClient } from '../index.js';

export class SolanaService {
  private readonly sdk: NosanaClient;
  public readonly rpc: SolanaClient['rpc'];
  public readonly rpcSubscriptions: SolanaClient['rpcSubscriptions'];
  public readonly sendAndConfirmTransaction: SolanaClient['sendAndConfirmTransaction'];

  constructor(sdk: NosanaClient) {
    this.sdk = sdk;
    const rpcEndpoint = this.sdk.config.solana.rpcEndpoint;
    if (!rpcEndpoint) throw new NosanaError('RPC URL is required', ErrorCodes.INVALID_CONFIG);
    const { rpc, rpcSubscriptions, sendAndConfirmTransaction } = createSolanaClient({
      urlOrMoniker: rpcEndpoint,
    });

    this.rpc = rpc;
    this.rpcSubscriptions = rpcSubscriptions;
    this.sendAndConfirmTransaction = sendAndConfirmTransaction;
  }

  public async pda(seeds: Array<Address | string>, programId: Address): Promise<Address> {
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
  }

  public async getBalance(addressStr: string | Address): Promise<bigint> {
    try {
      this.sdk.logger.debug(`Getting balance for address: ${addressStr}`);
      const addr = address(addressStr);
      const balance = await this.rpc.getBalance(addr).send();
      return balance.value;
    } catch (error) {
      this.sdk.logger.error(`Failed to get balance: ${error}`);
      throw new NosanaError('Failed to get balance', ErrorCodes.RPC_ERROR, error);
    }
  }

  public async getLatestBlockhash() {
    try {
      const { value: blockhash } = await this.rpc.getLatestBlockhash().send();
      return blockhash;
    } catch (error) {
      this.sdk.logger.error(`Failed to get latest blockhash: ${error}`);
      throw new NosanaError('Failed to get latest blockhash', ErrorCodes.RPC_ERROR, error);
    }
  }

  /**
   * Type guard to check if the input is a transaction
   */
  private isTransaction(
    input: unknown
  ): input is
    | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
    | (FullySignedTransaction & TransactionWithBlockhashLifetime) {
    return (
      typeof input === 'object' &&
      input !== null &&
      'instructions' in input &&
      'version' in input &&
      !('programAddress' in input)
    );
  }

  /**
   * Type guard to check if the input is a signed transaction
   */
  private isSignedTransaction(
    input: unknown
  ): input is FullySignedTransaction & TransactionWithBlockhashLifetime {
    return (
      typeof input === 'object' &&
      input !== null &&
      'signatures' in input &&
      Array.isArray((input as { signatures?: unknown[] }).signatures) &&
      (input as { signatures: unknown[] }).signatures.length > 0
    );
  }

  /**
   * Create, sign, and send a transaction with proper logging and error handling
   * @param instructionsOrTransaction Single instruction, array of instructions, or pre-built transaction
   * @returns The transaction signature
   */
  public async send(
    instructionsOrTransaction:
      | IInstruction
      | IInstruction[]
      | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
      | (FullySignedTransaction & TransactionWithBlockhashLifetime)
  ): Promise<Signature> {
    if (!this.sdk.wallet) {
      throw new NosanaError('No wallet found', ErrorCodes.NO_WALLET);
    }

    try {
      let signedTransaction: FullySignedTransaction & TransactionWithBlockhashLifetime;

      // Check if it's already a transaction or if we need to create one from instructions
      if (this.isTransaction(instructionsOrTransaction)) {
        // Check if it's already signed
        if (this.isSignedTransaction(instructionsOrTransaction)) {
          // Already signed, use it directly
          signedTransaction = instructionsOrTransaction;
        } else {
          // Not signed yet, sign it
          signedTransaction = await signTransactionMessageWithSigners(instructionsOrTransaction);
        }
      } else {
        // It's instructions, create and sign a transaction
        const instructions: IInstruction[] = Array.isArray(instructionsOrTransaction)
          ? (instructionsOrTransaction as IInstruction[])
          : [instructionsOrTransaction as IInstruction];

        const transaction = createTransaction({
          instructions,
          feePayer: this.sdk.wallet,
          latestBlockhash: await this.getLatestBlockhash(),
          version: 0,
        });

        // Sign the transaction with all required signers
        signedTransaction = await signTransactionMessageWithSigners(transaction);
      }

      // Get the transaction signature for logging
      const signature = getSignatureFromTransaction(signedTransaction);

      // Log the transaction explorer link
      const explorerLink = getExplorerLink({
        cluster: this.sdk.config.solana.cluster,
        transaction: signature,
      });

      this.sdk.logger.info(`Sending transaction: ${explorerLink}`);

      // Send and confirm the transaction
      await this.sendAndConfirmTransaction(signedTransaction);

      this.sdk.logger.info('Transaction confirmed!');

      return signature;
    } catch (err) {
      const errorMessage = `Failed to send transaction: ${err instanceof Error ? err.message : String(err)}`;
      this.sdk.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
