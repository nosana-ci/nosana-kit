import { address } from '@solana/kit';
import type { NosanaNetwork } from '@nosana/types';

import type { ClientConfig } from './types.js';
import type { LogLevel } from '../logger/Logger.js';

export const DEFAULT_CONFIGS: Record<NosanaNetwork, ClientConfig> = {
  mainnet: {
    solana: {
      cluster: 'mainnet-beta',
      rpcEndpoint: 'https://rpc.ironforge.network/mainnet?apiKey=01J4RYMAWZC65B6CND9DTZZ5BK',
      commitment: 'confirmed',
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
