import { NOS_MINT_ADDRESSES } from "@nosana/types";

import { NosanaNetwork, type Config } from "../types.js";

export const defaultConfig: Record<typeof NosanaNetwork[keyof typeof NosanaNetwork], Config> = {
  [NosanaNetwork.MAINNET]: {
    backend_url: 'https://dashboard.k8s.prd.nos.ci',
    client_manager_url: 'https://client-manager.k8s.prd.nosana.com',
    nos_address: NOS_MINT_ADDRESSES[NosanaNetwork.MAINNET]
  },
  [NosanaNetwork.DEVNET]: {
    backend_url: 'https://dashboard.k8s.dev.nos.ci',
    client_manager_url: 'https://client-manager.k8s.dev.nosana.com',
    nos_address: NOS_MINT_ADDRESSES[NosanaNetwork.DEVNET]
  },
  [NosanaNetwork.LOCALNET]: {
    backend_url: 'https://dashboard.k8s.dev.nos.ci',
    client_manager_url: 'https://client-manager.k8s.dev.nosana.com',
    nos_address: NOS_MINT_ADDRESSES[NosanaNetwork.LOCALNET]
  }
};
