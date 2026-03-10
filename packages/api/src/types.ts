import type { ClientManagerClient } from './client/client-manager/index.js';
import type { BlockchainIndexerClient } from './client/blockchain-indexer/index.js';
import type { HostManagerClient } from './client/host-manager/index.js';
import type { DeploymentManagerClient } from './client/deployment-manager/index.js';
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
  client_manager_url: string;
  host_manager_url: string;
  blockchain_indexer_url: string;
  deployment_manager_url: string;
  include_credentials: boolean;
}>

export interface Config {
  client_manager_url: string;
  host_manager_url: string;
  blockchain_indexer_url: string;
  deployment_manager_url: string;
  nos_address: string;
}

/**
 * All available API clients, organized by service.
 */
export interface NosanaClients {
  clientManager: ClientManagerClient;
  hostManager: HostManagerClient;
  blockchainIndexer: BlockchainIndexerClient;
  deploymentManager: DeploymentManagerClient;
}

export interface DeploymentRouteClients {
  deploymentManager: DeploymentManagerClient;
}

export type DeploymentRouteClientsWithSigner = DeploymentRouteClients & {
  solana: ExternalSolanaFunctions;
}