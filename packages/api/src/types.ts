import { QueryClient } from './client/index.js';
import { TopupVaultOptions } from './routes/deployments/types.js';

// Re-export shared types from @nosana/types
export { NosanaNetwork } from '@nosana/types';
export type { NosanaNetwork as NosanaNetworkType } from '@nosana/types';

export interface SolanaConfig {
  network: string;
}

export type ApiKeyAuth = string

/**
 * SignerAuth provides identifier and generate function for API authentication.
 * Used by nosana-kit which converts Wallet → SignerAuth via @nosana/authorization.
 */
export type ExternalSolanaFunctions = {
  /** Gets the balance of SOL and NOS tokens for a given address */
  getBalance: (address: string) => Promise<{ SOL: number; NOS: number }>;

  /** Transfers specified amounts of SOL and NOS to the recipient address */
  transferTokensToRecipient: (recipient: string, tokens: TopupVaultOptions) => Promise<void>;

  /** Deserializes, signs, sends, and confirms a Solana transaction */
  deserializeSignSendAndConfirmTransaction: (transaction: string) => Promise<string>;
}

export type SignerAuth = {
  identifier: string;
  generate: (message: string) => Promise<string>;
  solana: ExternalSolanaFunctions;
}

export type CreateNosanaApiOptions = Partial<{
  backend_url: string;
  include_credentials: boolean;
}>

export interface Config {
  backend_url: string;
  nos_address: string;
}

export interface RouteOptions {
  client: QueryClient
}

export type RouteOptionsWithSigner = RouteOptions & {
  solana: ExternalSolanaFunctions
}