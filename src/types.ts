import { TransactionSigner, MessageSigner } from '@solana/kit';
import type { SolanaService } from './services/SolanaService.js';
import { ClientConfig } from './config/types.js';
import { Logger } from './logger/Logger.js';

/**
 * A signer that can sign both messages and transactions.
 * This is a combination of MessageSigner and TransactionSigner,
 * allowing the signer to be used for both message signing and transaction signing.
 */
export type Signer = MessageSigner & TransactionSigner;

/**
 * Dependencies for program services
 */
export interface ProgramDeps {
  config: ClientConfig;
  logger: Logger;
  solana: SolanaService;
  getSigner: () => Signer | undefined;
}
