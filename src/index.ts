// ============================================================================
// @nosana/kit - Core Client & Types
// ============================================================================

/**
 * @group @nosana/kit
 */
export { createNosanaClient } from './NosanaClient.js';

/**
 * @group @nosana/kit
 */
export type { NosanaClient } from './NosanaClient.js';

/**
 * @group @nosana/kit
 */
export type { Wallet, ProgramDeps } from './types.js';

// ============================================================================
// @nosana/kit - Programs
// ============================================================================

/**
 * @group @nosana/kit
 */
export { createJobsProgram, JobState, MarketQueueType } from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export type { JobsProgram, Job, Market, Run } from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export type {
  Post,
  PostParams,
  PostInstruction,
} from './services/programs/jobs/instructions/post.js';

/**
 * @group @nosana/kit
 */
export type {
  Extend,
  ExtendParams,
  ExtendInstruction,
} from './services/programs/jobs/instructions/extend.js';

/**
 * @group @nosana/kit
 */
export type {
  Delist,
  DelistParams,
  DelistInstruction,
} from './services/programs/jobs/instructions/delist.js';

/**
 * @group @nosana/kit
 */
export type {
  SimpleMonitorEvent,
  MonitorEvent,
  MonitorEventType,
} from './services/programs/jobs/monitor/types.js';

/**
 * @group @nosana/kit
 */
export { createStakeProgram } from './services/programs/stake/index.js';

/**
 * @group @nosana/kit
 */
export type { StakeProgram, Stake } from './services/programs/stake/index.js';

/**
 * @group @nosana/kit
 */
export {
  createMerkleDistributorProgram,
  ClaimTarget,
} from './services/programs/merkleDistributor/index.js';

/**
 * @group @nosana/kit
 */
export type {
  MerkleDistributorProgram,
  MerkleDistributor,
  ClaimStatus,
} from './services/programs/merkleDistributor/index.js';

/**
 * @group @nosana/kit
 */
export { ClaimStatusNotFoundError } from './services/programs/merkleDistributor/index.js';

// ============================================================================
// @nosana/kit - Services
// ============================================================================

/**
 * @group @nosana/kit
 */
export { createTokenService } from './services/token/index.js';

/**
 * @group @nosana/kit
 */
export type {
  TokenService,
  TokenAccount,
  TokenAccountWithBalance,
} from './services/token/index.js';

/**
 * @group @nosana/kit
 */
export type { TokenServiceDeps, TokenServiceConfig } from './services/token/TokenService.js';

/**
 * @group @nosana/kit
 */
export { createSolanaService } from './services/solana/SolanaService.js';

/**
 * @group @nosana/kit
 */
export type { SolanaService, SolanaServiceDeps } from './services/solana/SolanaService.js';

// ============================================================================
// @nosana/kit - Configuration
// ============================================================================

/**
 * @group @nosana/kit
 */
export {
  DEFAULT_CONFIGS,
  getNosanaConfig,
  type ClientConfig,
  type PartialClientConfig,
  type SolanaConfig,
  type ProgramConfig,
  type APIConfig,
  type SolanaClusterMoniker,
  type SolanaCommitment,
} from './config/index.js';

// ============================================================================
// @nosana/kit - Errors & Logging
// ============================================================================

/**
 * @group @nosana/kit
 */
export { NosanaError, ErrorCodes, type ErrorCode } from './errors/NosanaError.js';

/**
 * @group @nosana/kit
 */
export { Logger, type LogLevel, type LoggerOptions } from './logger/Logger.js';

// ============================================================================
// @nosana/kit - Utilities
// ============================================================================

/**
 * @group @nosana/kit
 */
export type { ConvertTypesForDb } from './utils/convertBigIntToNumber.js';

/**
 * @group @nosana/kit
 */
export { walletToAuthorizationSigner } from './utils/walletToAuthorizationSigner.js';

// ============================================================================
// @nosana/kit - Generated Clients (Namespaces)
// ============================================================================

/**
 * @group @nosana/kit
 */
export * as JobsClient from './generated_clients/jobs/index.js';

/**
 * @group @nosana/kit
 */
export * as StakingClient from './generated_clients/staking/index.js';

/**
 * @group @nosana/kit
 */
export * as MerkleDistributorClient from './generated_clients/merkle_distributor/index.js';

// ============================================================================
// @nosana/authorization - Authentication & Authorization
// ============================================================================

/**
 * @group @nosana/authorization
 */
export { createNosanaAuthorization, validate, validateHeaders } from '@nosana/authorization';

/**
 * @group @nosana/authorization
 */
export type {
  NosanaAuthorization,
  SignMessageFn,
  SignerOrKey,
  AuthorizationStore,
  GenerateOptions,
  GenerateHeaderOptions,
  ValidateOptions,
} from '@nosana/authorization';

// ============================================================================
// @solana/kit - Re-exports
// ============================================================================

/**
 * @group @solana/kit
 */
export { address } from '@solana/kit';

import type { Address as SolanaAddress } from '@solana/kit';

/**
 * Represents a string that validates as a Solana address or public key.
 * @group @solana/kit
 */
export type Address = SolanaAddress;

// ============================================================================
// @nosana/types - Network & Enums
// ============================================================================

/**
 * @group @nosana/types
 */
export { NosanaNetwork } from '@nosana/types';

/**
 * @group @nosana/types
 */
export {
  DeploymentStatus,
  DeploymentStrategy,
  HealthCheckType,
  MarketQueue,
  ResourceTypeEnum,
  ServiceType,
  StdOptions,
} from '@nosana/types';

import { LogisticType as NosanaLogisticType } from '@nosana/types';

/**
 * Logistic type for job definitions.
 * - `api` - we receive and send via an endpoint
 * - `api-listen` - we create an endpoint to listen for incoming requests
 * @group @nosana/types
 */
export const LogisticType = NosanaLogisticType;

/**
 * @group @nosana/types
 */
export { validateJobDefinition, jobSchemas } from '@nosana/types';

/**
 * Job definition types for creating Nosana jobs
 * @group @nosana/types
 */
export type {
  // Job Definition
  JobDefinition,
  Flow,
  Execution,
  Operation,
  OperationType,
  OperationArgsMap,
  Ops,
  OpState,
  OperationResult,
  OperationResults,
  // Resources
  GPU,
  Resource,
  ResourceBase,
  ResourceType,
  Resources,
  RequiredResource,
  HFResource,
  OllamaResource,
  S3Resource,
  S3Auth,
  S3Base,
  S3Unsecure,
  S3WithBucket,
  S3WithBuckets,
  // Environment & Config
  Env,
  Variables,
  Image,
  DockerAuth,
  Volume,
  WorkDir,
  Private,
  Meta,
  Task,
  // Expose & Networking
  Expose,
  ExposeBase,
  ExposedPort,
  UniqueExposedPorts,
  Port,
  // Health Checks
  HealthCheck,
  HttpHealthCheck,
  WebSocketHealthCheck,
  // Logging
  Log,
  LogTypeTuple,
  UniqueLogTypeTag,
  // Other
  CMDArray,
  CMDString,
  LiteralString,
  Alias,
  Aliases,
  Vault,
  Logistic,
  FlowState,
  FlowSecrets,
  JobExposeSecrets,
  Events,
  StdOption,
  Revision,
  SpreadMarker,
  RemoveIfEmptyMarker,
  // Deployment
  Deployment,
  DeploymentId,
  EndpointSecret,
  EndpointStatus,
  webhooks,
  // Account types
  Job as TypesJob,
  Market as TypesMarket,
  Run as TypesRun,
} from '@nosana/types';

// ============================================================================
// @nosana/endpoints - Utilities
// ============================================================================

/**
 * @group @nosana/endpoints
 */
export {
  createHash,
  getExposeIdHash,
  getExposePorts,
  getJobExposeIdHash,
  getJobExposedServices,
  isOpExposed,
  isOperator,
  isSpreadMarker,
} from '@nosana/endpoints';

// ============================================================================
// @nosana/api - API Client
// ============================================================================

/**
 * @group @nosana/api
 */
export { createNosanaApi } from '@nosana/api';

/**
 * @group @nosana/api
 */
export type {
  // Core types
  NosanaApi,
  CreateNosanaApiOptions,
  ApiKeyAuth,
  SignerAuth,
  ApiConfig,
  // Job API types
  NosanaJobsApi,
  NosanaApiListJobRequest,
  NosanaApiListJobResponse,
  NosanaApiGetJobByAddressRequest,
  NosanaApiGetJobByAddressResponse,
  NosanaApiExtendJobRequest,
  NosanaApiExtendJobResponse,
  NosanaApiStopJobRequest,
  NosanaApiStopJobResponse,
  // Credits API types
  NosanaCreditsApi,
  Balance,
  // Markets API types
  NosanaMarketsApi,
  Market as ApiMarket,
  MarketRequiredResources,
} from '@nosana/api';

// ============================================================================
// @nosana/ipfs - IPFS Utilities
// ============================================================================

/**
 * @group @nosana/ipfs
 */
export { createIpfsClient, solBytesArrayToIpfsHash, ipfsHashToSolBytesArray } from '@nosana/ipfs';

/**
 * @group @nosana/ipfs
 */
export type { IPFSConfig, GetOverride, PostOverride, FetchClient } from '@nosana/ipfs';
