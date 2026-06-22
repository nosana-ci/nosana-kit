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
export {
  createJobsProgram,
  getNetworkFee,
  JobState,
  MarketQueueType,
} from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export type { JobsProgram, Job, Market, Run } from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export {
  getJobsInstructionComputeUnits,
  getJobsInstructionName,
  decodeJobsInstruction,
  type DecodedJobsInstruction,
  JOBS_COMPUTE_UNITS,
  type JobsInstructionName,
} from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export type {
  JobsBatchTransactionResult,
  SignedJobsBatchTransaction,
} from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export type {
  List,
  ListParams,
  ListInstruction,
} from './services/programs/jobs/instructions/list.js';

/**
 * @group @nosana/kit
 */
export type {
  Assign,
  AssignParams,
  AssignInstruction,
} from './services/programs/jobs/instructions/assign.js';

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
  Close,
  CloseParams,
  CloseInstruction,
} from './services/programs/jobs/instructions/close.js';

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
  Open,
  OpenParams,
  OpenInstruction,
} from './services/programs/jobs/instructions/open.js';

/**
 * @group @nosana/kit
 */
export type {
  Work,
  WorkParams,
  WorkInstruction,
} from './services/programs/jobs/instructions/work.js';

/**
 * @group @nosana/kit
 */
export type {
  Finish,
  FinishParams,
  FinishInstruction,
  FinishInstructions,
} from './services/programs/jobs/instructions/finish.js';

/**
 * @group @nosana/kit
 */
export type {
  Complete,
  CompleteParams,
  CompleteInstruction,
} from './services/programs/jobs/instructions/complete.js';

/**
 * @group @nosana/kit
 */
export type {
  Quit,
  QuitParams,
  QuitInstruction,
} from './services/programs/jobs/instructions/quit.js';

/**
 * @group @nosana/kit
 */
export type {
  Stop,
  StopParams,
  StopInstruction,
} from './services/programs/jobs/instructions/stop.js';

/**
 * @group @nosana/kit
 */
export type { PostParams, PostInstruction } from './services/programs/jobs/index.js';

/**
 * @group @nosana/kit
 */
export { MonitorEventType } from './services/programs/jobs/monitor/types.js';

/**
 * @group @nosana/kit
 */
export type { SimpleMonitorEvent, MonitorEvent } from './services/programs/jobs/monitor/types.js';

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
  TokenBalanceInfo,
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
export type {
  BalanceInfo,
  SolBalanceInfo,
  SolanaService,
  SolanaServiceDeps,
  BatchTransactionResult,
  SignedBatchTransaction,
} from './services/solana/SolanaService.js';

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
  type AuthorizationConfig,
  type SolanaConfig,
  type PriorityFeesConfig,
  type PriorityFeesConfigFixed,
  type PriorityFeesConfigDynamic,
  type PriorityFeeStrategy,
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

/**
 * @group @nosana/kit
 */
export {
  packInstructions,
  TRANSACTION_SIZE_LIMIT,
  MAX_COMPUTE_UNITS,
  type PackInstructionsOptions,
} from './utils/packInstructions.js';

// ============================================================================
// @nosana/kit - Keypair Helpers
// ============================================================================

/**
 * @group @nosana/kit
 */
export {
  generateWallet,
  createWalletFromBytes,
  createWalletFromBase58,
  loadWalletFromFile,
} from './utils/keypair.js';

// ============================================================================
// @nosana/kit - Generated Clients (Namespaces)
// ============================================================================

/**
 * @group @nosana/kit
 */
export * as JobsClient from '@nosana/jobs-program';

/**
 * @group @nosana/kit
 */
export * as StakingClient from '@nosana/stake-program';

/**
 * @group @nosana/kit
 */
export * as MerkleDistributorClient from '@nosana/merkle-distributor-program';

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
export {
  address,
  generateKeyPairSigner,
  createKeyPairSignerFromBytes,
  createKeyPairFromBytes,
  createSignerFromKeyPair,
} from '@solana/kit';

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
  Logistic,
  FlowState,
  FlowSecrets,
  JobExposeSecrets,
  Event,
  StdOption,
  Revision,
  SpreadMarker,
  RemoveIfEmptyMarker,
  // Deployment (raw data types from OpenAPI schema)
  Deployment as DeploymentRaw,
  Vault as VaultRaw,
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
export { createNosanaApi, generateIdempotencyKey } from '@nosana/api';

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
  NosanaJobActionOptions,
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
  // Deployment API types (with methods - takes priority over types-module Deployment)
  ApiDeployment,
  Deployment,
  CreateDeployment,
  DeploymentCreateBody,
  DeploymentState,
  DeploymentJob,
  Vault,
  TopupVaultOptions,
  DeploymentsApi,
  ApiDeploymentsApi,
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
