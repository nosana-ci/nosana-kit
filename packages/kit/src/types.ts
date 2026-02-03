import { TransactionSigner, MessageSigner } from '@solana/kit';
import type { SolanaService } from './services/solana/index.js';
import type { TokenService } from './services/token/index.js';
import { Logger } from './logger/Logger.js';

/**
 * A wallet that can sign both messages and transactions.
 * This is a combination of MessageSigner and TransactionSigner,
 * allowing the wallet to be used for both message signing and transaction signing.
 * @group @nosana/kit
 */
export type Wallet = MessageSigner & TransactionSigner;

/**
 * Dependencies for program services
 * @group @nosana/kit
 */
export interface ProgramDeps {
  logger: Logger;
  solana: SolanaService;
  nos: TokenService;
  getWallet: () => Wallet | undefined;
}
