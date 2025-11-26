import type { Address, TransactionSigner } from '@solana/kit';
import type { IPFSConfig } from '@nosana/ipfs';

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

export interface SolanaConfig {
  cluster: SolanaClusterMoniker;
  rpcEndpoint: string;
  wsEndpoint?: string; // Optional WebSocket endpoint, if different from HTTP
  commitment?: SolanaCommitment;
  feePayer?: TransactionSigner; // Optional fee payer for transactions
}

export interface ProgramConfig {
  nosTokenAddress: Address;
  jobsAddress: Address;
  rewardsAddress: Address;
  stakeAddress: Address;
  poolsAddress: Address;
  merkleDistributorAddress: Address;
}

export interface ClientConfig {
  solana: SolanaConfig;
  wallet?: Wallet;
  logLevel: LogLevel;
  ipfs: IPFSConfig;
  programs: ProgramConfig;
}

export interface PartialClientConfig {
  solana?: Partial<SolanaConfig>;
  wallet?: Wallet;
  ipfs?: Partial<IPFSConfig>;
  logLevel?: LogLevel;
}
