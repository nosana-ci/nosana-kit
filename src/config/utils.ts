import { ErrorCodes, NosanaError } from '../errors/NosanaError.js';
import { DEFAULT_CONFIGS } from './defaultConfigs.js';
import { ClientConfig, NosanaNetwork, PartialClientConfig } from './types.js';

export const mergeConfigs = (
  defaultConfig: ClientConfig,
  customConfig?: PartialClientConfig
): ClientConfig => {
  if (!customConfig) return defaultConfig;

  return {
    ...defaultConfig,
    ...customConfig,
    solana: {
      ...defaultConfig.solana,
      ...customConfig.solana,
    },
    ipfs: {
      ...defaultConfig.ipfs,
      ...customConfig.ipfs,
    },
  };
};

export const getNosanaConfig = (
  network: NosanaNetwork = NosanaNetwork.MAINNET,
  config?: PartialClientConfig
): ClientConfig => {
  const defaultConfig = DEFAULT_CONFIGS[network];
  if (!defaultConfig) {
    throw new NosanaError(`Unsupported Nosana network: ${network}`, ErrorCodes.INVALID_NETWORK);
  }
  return mergeConfigs(defaultConfig, config);
};

// Example: Initialize with default (Mainnet) or specific network, or custom config
// const defaultConfig = getNosanaConfig();
// const devConfig = getNosanaConfig(NosanaNetwork.DEVNET);
// const customConfig = getNosanaConfig(NosanaNetwork.MAINNET, {
//   solana: {
//     rpcEndpoint: 'your-custom-rpc-endpoint-url',
//   },
//   ipfs: {
//     jwt: 'your-custom-jwt-token',
//     gateway: 'https://your-custom-gateway.com/ipfs/',
//   },
//   logLevel: 'debug',
// });
