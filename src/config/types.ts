import { Address, TransactionSigner } from '@solana/kit';
import type { Wallet } from '../types.js';
import type { LogLevel } from '../logger/Logger.js';

export enum NosanaNetwork {
  MAINNET = 'mainnet',
  DEVNET = 'devnet',
}

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

export interface ClientConfig {
  solana: SolanaConfig;
  wallet?: Wallet;
  logLevel: LogLevel;
  ipfs: IpfsConfig;
  programs: {
    nosTokenAddress: Address;
    jobsAddress: Address;
    rewardsAddress: Address;
    stakeAddress: Address;
    poolsAddress: Address;
    merkleDistributorAddress: Address;
  };
}

export interface PartialClientConfig {
  solana?: Partial<SolanaConfig>;
  wallet?: Wallet;
  ipfs?: Partial<IpfsConfig>;
  logLevel?: LogLevel;
}
