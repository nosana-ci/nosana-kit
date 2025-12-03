import { TransactionSigner, MessageSigner } from '@solana/kit';
import type { SolanaService } from './services/solana/index.js';
import { Logger } from './logger/Logger.js';

/**
 * A wallet that can sign both messages and transactions.
 * This is a combination of MessageSigner and TransactionSigner,
 * allowing the wallet to be used for both message signing and transaction signing.
 */
export type Wallet = MessageSigner & TransactionSigner;

/**
 * Dependencies for program services
 */
export interface ProgramDeps {
  logger: Logger;
  solana: SolanaService;
  getWallet: () => Wallet | undefined;
}
