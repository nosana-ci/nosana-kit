import type { ClientManagerClient } from './client/client-manager/index.js';
import type { BlockchainIndexerClient } from './client/blockchain-indexer/index.js';
import type { HostManagerClient } from './client/host-manager/index.js';
import type { DeploymentManagerClient } from './client/deployment-manager/index.js';
import type { GenerateOptions } from '@nosana/authorization';
import { TopupVaultOptions } from './routes/deployments/types.js';

// Re-export shared types from @nosana/types
import { NosanaNetwork } from '@nosana/types';
export { NosanaNetwork };
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
  generate: SignedHeaderAuth['generate'];
  solana: ExternalSolanaFunctions;
}

/**
 * The minimal auth a node needs. A node verifies the signed `authorization`
 * header against the job owner's key, so only a header generator is required;
 * `x-user-id` is optional and unused by nodes. `SignerAuth` satisfies it, and
 * an API-key caller supplies one backed by the client manager's signing service.
 */
export type SignedHeaderAuth = {
  identifier?: string;
  /** Terminal grants request fresh signing without touching the normal auth cache. */
  generate: (message: string, options?: Pick<GenerateOptions, 'skipCache'>) => Promise<string>;
}

export type CreateNosanaApiOptions = Partial<{
  client_manager_url: string;
  host_manager_url: string;
  blockchain_indexer_url: string;
  /** Under API key auth this becomes the client manager proxy's forwarding target. */
  deployment_manager_url: string;
  /** Domain under which every node's API answers, as `<address>.<domain>`. */
  node_domain: string;
  include_credentials: boolean;
}>

export interface Config {
  client_manager_url: string;
  host_manager_url: string;
  blockchain_indexer_url: string;
  deployment_manager_url: string;
  node_domain: string;
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

/** An open stream, for as long as the caller wants it. */
export type StreamSubscription = { close: () => void };

/** What every stream reports besides its frames. */
export interface StreamLifecycleHandlers {
  /** The stream opened, or reopened after dropping: resynchronise from here. */
  onOpen?: () => void;
  onError?: (error: unknown) => void;
}

export interface DeploymentRouteClients {
  deploymentManager: DeploymentManagerClient;
  /** Network and options a deployment needs to reach its jobs' nodes directly. */
  environment: NosanaNetwork;
  options?: CreateNosanaApiOptions;
}

export type DeploymentRouteClientsWithSigner = DeploymentRouteClients & {
  solana: ExternalSolanaFunctions;
}