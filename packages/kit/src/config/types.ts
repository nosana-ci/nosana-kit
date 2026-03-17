import { ApiConfig } from '@nosana/api';
import type { IPFSConfig } from '@nosana/ipfs';
import type { AuthorizationStore } from '@nosana/authorization';
import type { Address, TransactionSigner } from '@solana/kit';

import type { Wallet } from '../types.js';
import type { LogLevel } from '../logger/Logger.js';

export const SolanaClusterMoniker = {
  DEVNET: 'devnet',
  LOCALNET: 'localnet',
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
  MAINNET_BETA: 'mainnet-beta',
  LOCALHOST: 'localhost',
} as const;

export type SolanaClusterMoniker = (typeof SolanaClusterMoniker)[keyof typeof SolanaClusterMoniker];

export const SolanaCommitment = {
  PROCESSED: 'processed',
  CONFIRMED: 'confirmed',
  FINALIZED: 'finalized',
} as const;

export type SolanaCommitment = (typeof SolanaCommitment)[keyof typeof SolanaCommitment];

/**
 * Fixed priority fee: use the same microLamports (per compute unit) for every transaction.
 */
export interface PriorityFeesConfigFixed {
  type: 'fixed';
  /** Priority fee in micro-lamports per compute unit (e.g. 1_000 = 0.001 lamports per CU). */
  microLamports: number;
}

/** Strategy presets for dynamic priority fee (maps to percentiles: low=25, medium=50, high=75). */
export type PriorityFeeStrategy = 'low' | 'medium' | 'high';

/**
 * Dynamic priority fee: fetch recent prioritization fees from the RPC and use a percentile or strategy.
 * Optional accountAddresses (writable accounts) can be passed for more accurate fees; defaults to SOL + USDC mints.
 */
export interface PriorityFeesConfigDynamic {
  type: 'dynamic';
  /** Strategy preset (low/medium/high). Ignored if percentile is set. */
  strategy?: PriorityFeeStrategy;
  /** Percentile of recent fees to use (0–100). Default 50 when strategy not set */
  percentile?: number;
  /** Minimum micro-lamports per compute unit. Also used as fallback when dynamic fetch is empty or fails. */
  min?: number;
  /** Maximum micro-lamports per compute unit. */
  max?: number;
  /** Writable account addresses for fee estimation (max 128). When not set, RPC is called with none. */
  accountAddresses?: readonly Address[];
}

export type PriorityFeesConfig = PriorityFeesConfigFixed | PriorityFeesConfigDynamic;

export interface SolanaConfig {
  cluster: SolanaClusterMoniker;
  rpcEndpoint: string;
  wsEndpoint?: string; // Optional WebSocket endpoint, if different from HTTP
  commitment?: SolanaCommitment;
  feePayer?: TransactionSigner; // Optional fee payer for transactions
  /** Optional priority fee: fixed microLamports or dynamic from getRecentPrioritizationFees. */
  priorityFees?: PriorityFeesConfig;
}

export interface ProgramConfig {
  nosTokenAddress: Address;
  jobsAddress: Address;
  rewardsAddress: Address;
  stakeAddress: Address;
  poolsAddress: Address;
  merkleDistributorAddress: Address;
}

export interface APIConfig extends ApiConfig {
  apiKey?: string;
}

export interface AuthorizationConfig {
  store?: AuthorizationStore['actions'];
}

export interface ClientConfig {
  solana: SolanaConfig;
  wallet?: Wallet;
  logLevel: LogLevel;
  ipfs: IPFSConfig;
  programs: ProgramConfig;
  api?: APIConfig;
  authorization?: AuthorizationConfig;
}

export interface PartialClientConfig {
  solana?: Partial<SolanaConfig>;
  wallet?: Wallet;
  ipfs?: Partial<IPFSConfig>;
  logLevel?: LogLevel;
  programs?: Partial<ProgramConfig>;
  api?: Partial<APIConfig>;
  authorization?: Partial<AuthorizationConfig>;
}
