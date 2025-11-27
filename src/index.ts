// Export the main client
export { createNosanaClient, type NosanaClient } from './NosanaClient.js';

// Export types - explicitly re-export NosanaNetwork from types to resolve ambiguity
export * from '@nosana/types';
export type * from '@nosana/api';
export { NosanaNetwork } from '@nosana/types';

export type { Wallet } from './types.js';

// Export types and configuration
export * from './config/index.js';
export * from './errors/NosanaError.js';
export * from './logger/Logger.js';

// Export JobsProgram and related types
export {
  createJobsProgram,
  type JobsProgram,
  JobState,
  MarketQueueType,
} from './services/programs/JobsProgram.js';
export type { Job, Market, Run } from './services/programs/JobsProgram.js';

// Export StakeProgram and related types
export { createStakeProgram, type StakeProgram } from './services/programs/StakeProgram.js';
export type { Stake } from './services/programs/StakeProgram.js';

// Export MerkleDistributorProgram and related types
export {
  createMerkleDistributorProgram,
  type MerkleDistributorProgram,
  ClaimTarget,
} from './services/programs/MerkleDistributorProgram.js';
export type {
  MerkleDistributor,
  ClaimStatus,
} from './services/programs/MerkleDistributorProgram.js';
export { ClaimStatusNotFoundError } from './services/programs/MerkleDistributorProgram.js';

// Export IPFS utilities from @nosana/ipfs
export { solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/ipfs';

// Export token service
export { createTokenService, type TokenService } from './services/TokenService.js';
export type { TokenAccount, TokenAccountWithBalance } from './services/TokenService.js';

// Export generated clients under namespaces to avoid naming conflicts
export * as JobsClient from './generated_clients/jobs/index.js';
export * as StakingClient from './generated_clients/staking/index.js';
export * as MerkleDistributorClient from './generated_clients/merkle_distributor/index.js';
