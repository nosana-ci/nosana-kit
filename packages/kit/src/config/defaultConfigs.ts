import { address, type Address } from '@solana/kit';
import type { NosanaNetwork } from '@nosana/types';

import type { ClientConfig } from './types.js';
import type { LogLevel } from '../logger/Logger.js';

// Priority fee defaults (matches legacy SDK); used only in DEFAULT_CONFIGS below
const SOL_MINT_ADDRESS: Address = address('So11111111111111111111111111111111111111112');
const USDC_MINT_ADDRESS: Address = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DEVNET_MINT_ADDRESS: Address = address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// The RPC API key and IPFS JWT below are intentionally public: they are scoped,
// rate-limited keys shared with the community as defaults. Override via custom
// config for production use.

export const DEFAULT_CONFIGS: Record<NosanaNetwork, ClientConfig> = {
  mainnet: {
    solana: {
      cluster: 'mainnet-beta',
      rpcEndpoint: 'https://rpc.ironforge.network/mainnet?apiKey=01J4RYMAWZC65B6CND9DTZZ5BK',
      commitment: 'confirmed',
      priorityFees: {
        type: 'dynamic',
        strategy: 'medium',
        min: 10_000,
        max: 15_000_000,
        accountAddresses: [SOL_MINT_ADDRESS, USDC_MINT_ADDRESS],
      },
    },
    ipfs: {
      api: 'https://api.pinata.cloud',
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmZDUwODE1NS1jZDJhLTRlMzYtYWI4MC0wNmMxNjRmZWY1MTkiLCJlbWFpbCI6Implc3NlQG5vc2FuYS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1YzVhNWM2N2RlYWU2YzNhNzEwOCIsInNjb3BlZEtleVNlY3JldCI6ImYxOWFjZDUyZDk4ZTczNjU5MmEyY2IzZjQwYWUxNGE2ZmYyYTkxNDJjZTRiN2EzZGQ5OTYyOTliMmJkN2IzYzEiLCJpYXQiOjE2ODY3NzE5Nzl9.r4_pWCCT79Jis6L3eegjdBdAt5MpVd1ymDkBuNE25g8',
      gateway: 'https://nosana.mypinata.cloud/ipfs/',
    },
    programs: {
      nosTokenAddress: address('nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7'),
      jobsAddress: address('nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM'),
      rewardsAddress: address('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp'),
      stakeAddress: address('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE'),
      poolsAddress: address('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD'),
      merkleDistributorAddress: address('merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425'),
    },
    logLevel: 'error' as LogLevel,
  },
  devnet: {
    solana: {
      cluster: 'devnet',
      rpcEndpoint: 'https://api.devnet.solana.com',
      commitment: 'confirmed',
      priorityFees: {
        type: 'dynamic',
        strategy: 'medium',
        min: 10_000,
        max: 15_000_000,
        accountAddresses: [SOL_MINT_ADDRESS, USDC_DEVNET_MINT_ADDRESS],
      },
    },
    ipfs: {
      api: 'https://api.pinata.cloud',
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmZDUwODE1NS1jZDJhLTRlMzYtYWI4MC0wNmMxNjRmZWY1MTkiLCJlbWFpbCI6Implc3NlQG5vc2FuYS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1YzVhNWM2N2RlYWU2YzNhNzEwOCIsInNjb3BlZEtleVNlY3JldCI6ImYxOWFjZDUyZDk4ZTczNjU5MmEyY2IzZjQwYWUxNGE2ZmYyYTkxNDJjZTRiN2EzZGQ5OTYyOTliMmJkN2IzYzEiLCJpYXQiOjE2ODY3NzE5Nzl9.r4_pWCCT79Jis6L3eegjdBdAt5MpVd1ymDkBuNE25g8',
      gateway: 'https://nosana.mypinata.cloud/ipfs/',
    },
    programs: {
      nosTokenAddress: address('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP'),
      jobsAddress: address('nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR'),
      rewardsAddress: address('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp'),
      stakeAddress: address('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE'),
      poolsAddress: address('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD'),
      merkleDistributorAddress: address('merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425'),
    },
    logLevel: 'debug' as LogLevel,
  },
  localnet: {
    solana: {
      cluster: 'localnet',
      rpcEndpoint: 'http://127.0.0.1:8899',
      wsEndpoint: 'ws://127.0.0.1:8900',
      commitment: 'confirmed',
      priorityFees: {
        type: 'dynamic',
        strategy: 'medium',
        min: 10_000,
        max: 15_000_000,
        accountAddresses: [SOL_MINT_ADDRESS, USDC_DEVNET_MINT_ADDRESS],
      },
    },
    ipfs: {
      api: 'https://api.pinata.cloud',
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJmZDUwODE1NS1jZDJhLTRlMzYtYWI4MC0wNmMxNjRmZWY1MTkiLCJlbWFpbCI6Implc3NlQG5vc2FuYS5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1YzVhNWM2N2RlYWU2YzNhNzEwOCIsInNjb3BlZEtleVNlY3JldCI6ImYxOWFjZDUyZDk4ZTczNjU5MmEyY2IzZjQwYWUxNGE2ZmYyYTkxNDJjZTRiN2EzZGQ5OTYyOTliMmJkN2IzYzEiLCJpYXQiOjE2ODY3NzE5Nzl9.r4_pWCCT79Jis6L3eegjdBdAt5MpVd1ymDkBuNE25g8',
      gateway: 'https://nosana.mypinata.cloud/ipfs/',
    },
    programs: {
      nosTokenAddress: address('devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP'),
      jobsAddress: address('nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR'),
      rewardsAddress: address('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp'),
      stakeAddress: address('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE'),
      poolsAddress: address('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD'),
      merkleDistributorAddress: address('merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425'),
    },
    logLevel: 'debug' as LogLevel,
  },
};
