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
  IInstruction,
  TransactionMessageWithBlockhashLifetime,
  CompilableTransactionMessage,
  FullySignedTransaction,
  TransactionWithBlockhashLifetime,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  sendAndConfirmTransactionFactory,
} from '@solana/kit';
import { NosanaError, ErrorCodes } from '../errors/NosanaError.js';
import { Logger } from '../logger/Logger.js';
import { Signer } from '../types.js';

/**
 * Helper function to create an explorer link for a transaction
 */
function getExplorerLink(cluster: string, signature: Signature): string {
  const clusterPath =
    cluster === 'mainnet-beta' || cluster === 'mainnet' ? '' : `?cluster=${cluster}`;
  return `https://explorer.solana.com/tx/${signature}${clusterPath}`;
}

/**
 * Dependencies for SolanaService
 */
export interface SolanaServiceDeps {
  rpcEndpoint: string;
  cluster: string;
  logger: Logger;
  getSigner: () => Signer | undefined;
}

/**
 * Solana service interface
 */
export interface SolanaService {
  readonly rpc: ReturnType<typeof createSolanaRpc>;
  readonly rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  readonly sendAndConfirmTransaction: ReturnType<typeof sendAndConfirmTransactionFactory>;
  pda(seeds: Array<Address | string>, programId: Address): Promise<Address>;
  getBalance(addressStr: string | Address): Promise<bigint>;
  getLatestBlockhash(): Promise<{ blockhash: string; lastValidBlockHeight: bigint }>;
  send(
    instructionsOrTransaction:
      | IInstruction
      | IInstruction[]
      | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
      | (FullySignedTransaction & TransactionWithBlockhashLifetime)
  ): Promise<Signature>;
}

/**
 * Creates a Solana service instance.
 *
 * This function follows a functional architecture pattern, avoiding classes
 * to prevent bundle bloat and dual-package hazard issues.
 */
export function createSolanaService(deps: SolanaServiceDeps): SolanaService {
  if (!deps.rpcEndpoint) {
    throw new NosanaError('RPC URL is required', ErrorCodes.INVALID_CONFIG);
  }

  const rpc = createSolanaRpc(deps.rpcEndpoint);
  const rpcSubscriptions = createSolanaRpcSubscriptions(deps.rpcEndpoint);
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  return {
    rpc,
    rpcSubscriptions,
    sendAndConfirmTransaction,

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

    async getBalance(addressStr: string | Address): Promise<bigint> {
      try {
        deps.logger.debug(`Getting balance for address: ${addressStr}`);
        const addr = address(addressStr);
        const balance = await rpc.getBalance(addr).send();
        return balance.value;
      } catch (error) {
        deps.logger.error(`Failed to get balance: ${error}`);
        throw new NosanaError('Failed to get balance', ErrorCodes.RPC_ERROR, error);
      }
    },

    async getLatestBlockhash() {
      try {
        const response = await rpc.getLatestBlockhash().send();
        return response.value;
      } catch (error) {
        deps.logger.error(`Failed to get latest blockhash: ${error}`);
        throw new NosanaError('Failed to get latest blockhash', ErrorCodes.RPC_ERROR, error);
      }
    },

    /**
     * Create, sign, and send a transaction with proper logging and error handling
     * @param instructionsOrTransaction Single instruction, array of instructions, or pre-built transaction
     * @returns The transaction signature
     */
    async send(
      instructionsOrTransaction:
        | IInstruction
        | IInstruction[]
        | (CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime)
        | (FullySignedTransaction & TransactionWithBlockhashLifetime)
    ): Promise<Signature> {
      const signer = deps.getSigner();
      if (!signer) {
        throw new NosanaError('No signer found', ErrorCodes.NO_WALLET);
      }

      try {
        let signedTransaction: FullySignedTransaction & TransactionWithBlockhashLifetime;

        // Check if it's already a transaction or if we need to create one from instructions
        const isTransaction =
          typeof instructionsOrTransaction === 'object' &&
          instructionsOrTransaction !== null &&
          'instructions' in instructionsOrTransaction &&
          'version' in instructionsOrTransaction &&
          !('programAddress' in instructionsOrTransaction);

        if (isTransaction) {
          // Check if it's already signed
          const isSigned =
            typeof instructionsOrTransaction === 'object' &&
            instructionsOrTransaction !== null &&
            'signatures' in instructionsOrTransaction &&
            Array.isArray((instructionsOrTransaction as { signatures?: unknown[] }).signatures) &&
            (instructionsOrTransaction as { signatures: unknown[] }).signatures.length > 0;

          if (isSigned) {
            // Already signed, use it directly
            signedTransaction = instructionsOrTransaction as unknown as FullySignedTransaction &
              TransactionWithBlockhashLifetime;
          } else {
            // Not signed yet, sign it
            signedTransaction = await signTransactionMessageWithSigners(instructionsOrTransaction);
          }
        } else {
          // It's instructions, create and sign a transaction
          const instructions: IInstruction[] = Array.isArray(instructionsOrTransaction)
            ? (instructionsOrTransaction as IInstruction[])
            : [instructionsOrTransaction as IInstruction];

          const latestBlockhash = await this.getLatestBlockhash();
          // Create transaction message with instructions
          const baseMessage = createTransactionMessage({ version: 0 });
          const transactionMessage = {
            ...baseMessage,
            instructions,
          } as unknown as CompilableTransactionMessage;
          const transactionMessageWithFeePayer = setTransactionMessageFeePayer(
            signer.address,
            transactionMessage
          ) as unknown as CompilableTransactionMessage;
          // Type assertion needed due to complex type inference in @solana/kit
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Type assertions needed due to complex type inference in @solana/kit
          // The RPC returns blockhash as string, but @solana/kit expects Blockhash branded type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transaction = setTransactionMessageLifetimeUsingBlockhash(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            latestBlockhash as any, // Blockhash type from RPC response
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transactionMessageWithFeePayer as any
          ) as CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime;

          // Sign the transaction
          signedTransaction = await signTransactionMessageWithSigners(transaction);
        }

        // Get the transaction signature for logging
        const signature = getSignatureFromTransaction(signedTransaction);

        // Log the transaction explorer link
        const explorerLink = getExplorerLink(deps.cluster, signature);

        deps.logger.info(`Sending transaction: ${explorerLink}`);

        // Send and confirm the transaction
        await sendAndConfirmTransaction(signedTransaction, { commitment: 'confirmed' });

        deps.logger.info('Transaction confirmed!');

        return signature;
      } catch (err) {
        const errorMessage = `Failed to send transaction: ${err instanceof Error ? err.message : String(err)}`;
        deps.logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
  };
}
