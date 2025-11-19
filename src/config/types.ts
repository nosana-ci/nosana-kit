import { Address } from '@solana/kit';
import type { Signer } from '../types.js';

export enum NosanaNetwork {
  MAINNET = 'mainnet',
  DEVNET = 'devnet',
}

export enum NosanaLogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
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
}

export interface IpfsConfig {
  api: string;
  jwt: string;
  gateway: string;
}

export interface ClientConfig {
  solana: SolanaConfig;
  signer?: Signer;
  logLevel: NosanaLogLevel;
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
  signer?: Signer;
  ipfs?: Partial<IpfsConfig>;
  logLevel?: NosanaLogLevel;
}
