import { Address, KeyPairSigner, SolanaClusterMoniker } from 'gill';

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

export interface SolanaConfig {
  cluster: SolanaClusterMoniker | "mainnet-beta" | "localhost";
  rpcEndpoint: string;
  wsEndpoint?: string; // Optional WebSocket endpoint, if different from HTTP
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export interface WalletConfig {
  signer: KeyPairSigner;
}
export interface IpfsConfig {
  api: string;
  jwt: string;
  gateway: string;
}

export interface ClientConfig {
  solana: SolanaConfig;
  wallet?: WalletConfig;
  logLevel: NosanaLogLevel;
  ipfs: IpfsConfig;
  programs: {
    nosTokenAddress: Address;
    jobsAddress: Address;
    rewardsAddress: Address;
    stakeAddress: Address;
    poolsAddress: Address;
  }
}

export interface PartialClientConfig {
  solana?: Partial<SolanaConfig>;
  wallet?: WalletConfig;
}
