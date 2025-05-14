import { KeyPairSigner } from 'gill';

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
  cluster: string;
  rpcEndpoint: string;
  wsEndpoint?: string; // Optional WebSocket endpoint, if different from HTTP
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

export interface WalletConfig {
  signer: KeyPairSigner;
}

export interface ClientConfig {
  solana: SolanaConfig;
  wallet?: WalletConfig;
  logLevel: NosanaLogLevel;
}

export interface PartialClientConfig {
  solana?: Partial<SolanaConfig>;
  wallet?: WalletConfig;
}
