import { ClientConfig, NosanaLogLevel, NosanaNetwork } from "./types";

export const DEFAULT_CONFIGS: Record<NosanaNetwork, ClientConfig> = {
  mainnet: {
    solana: {
      cluster: 'mainnet-beta',
      rpcEndpoint: 'https://rpc.ironforge.network/mainnet?apiKey=01J4RYMAWZC65B6CND9DTZZ5BK',
      commitment: 'confirmed',
    },
    logLevel: NosanaLogLevel.ERROR,
  },
  devnet: {
    solana: {
      cluster: 'devnet',
      rpcEndpoint: 'https://api.devnet.solana.com',
      commitment: 'confirmed',
    },
    logLevel: NosanaLogLevel.DEBUG,
  },
};


