import { Address, TransactionSigner } from '@solana/kit';
import type { Wallet } from '../types.js';
import type { LogLevel } from '../logger/Logger.js';

export const NosanaNetwork = {
  MAINNET: 'mainnet',
  DEVNET: 'devnet',
} as const;

export type NosanaNetwork = (typeof NosanaNetwork)[keyof typeof NosanaNetwork];

export type SolanaClusterMoniker =
  | 'devnet'
  | 'localnet'
  | 'mainnet'
  | 'testnet'
  | 'mainnet-beta'
  | 'localhost';

export interface SolanaConfig {
  cluster: SolanaClusterMoniker;
  rpcEndpoint: string;
  wsEndpoint?: string; // Optional WebSocket endpoint, if different from HTTP
  commitment?: 'processed' | 'confirmed' | 'finalized';
  feePayer?: TransactionSigner; // Optional fee payer for transactions
}

export interface IpfsConfig {
  api: string;
  jwt: string;
  gateway: string;
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
  ipfs: IpfsConfig;
  programs: ProgramConfig;
}

export interface PartialClientConfig {
  solana?: Partial<SolanaConfig>;
  wallet?: Wallet;
  ipfs?: Partial<IpfsConfig>;
  logLevel?: LogLevel;
}
