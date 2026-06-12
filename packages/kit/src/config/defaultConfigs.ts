import { address, type Address } from '@solana/kit';
import { NOS_MINT_ADDRESSES, NosanaNetwork } from '@nosana/types';
import { defaultIPFSConfig } from '@nosana/ipfs';

import type { ClientConfig } from './types.js';
import type { LogLevel } from '../logger/Logger.js';

// Priority fee defaults (matches legacy SDK); used only in DEFAULT_CONFIGS below
const SOL_MINT_ADDRESS: Address = address('So11111111111111111111111111111111111111112');
const USDC_MINT_ADDRESS: Address = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DEVNET_MINT_ADDRESS: Address = address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// The RPC API key below (and the IPFS JWT in defaultIPFSConfig) is intentionally
// public: they are scoped, rate-limited keys shared with the community as defaults.
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
    ipfs: { ...defaultIPFSConfig },
    programs: {
      nosTokenAddress: address(NOS_MINT_ADDRESSES[NosanaNetwork.MAINNET]),
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
    ipfs: { ...defaultIPFSConfig },
    programs: {
      nosTokenAddress: address(NOS_MINT_ADDRESSES[NosanaNetwork.DEVNET]),
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
    ipfs: { ...defaultIPFSConfig },
    programs: {
      nosTokenAddress: address(NOS_MINT_ADDRESSES[NosanaNetwork.LOCALNET]),
      jobsAddress: address('nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR'),
      rewardsAddress: address('nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp'),
      stakeAddress: address('nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE'),
      poolsAddress: address('nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD'),
      merkleDistributorAddress: address('merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425'),
    },
    logLevel: 'debug' as LogLevel,
  },
};
