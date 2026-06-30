import { NOS_MINT_ADDRESSES } from "@nosana/types";

import { NosanaNetwork, type Config } from "../types.js";

export const defaultConfig: Record<typeof NosanaNetwork[keyof typeof NosanaNetwork], Config> = {
  [NosanaNetwork.MAINNET]: {
    client_manager_url: 'https://client-manager.k8s.prd.nosana.com',
    host_manager_url: 'https://host-manager.k8s.prd.nosana.com',
    blockchain_indexer_url: 'https://blockchain-indexer.k8s.prd.nos.ci',
    deployment_manager_url: 'https://deployment-manager.k8s.prd.nos.ci',
    nos_address: NOS_MINT_ADDRESSES[NosanaNetwork.MAINNET]
  },
  [NosanaNetwork.DEVNET]: {
    client_manager_url: 'https://client-manager.k8s.dev.nosana.com',
    host_manager_url: 'https://host-manager.k8s.dev.nosana.com',
    blockchain_indexer_url: 'https://blockchain-indexer.k8s.dev.nos.ci',
    deployment_manager_url: 'https://deployment-manager.k8s.dev.nos.ci',
    nos_address: NOS_MINT_ADDRESSES[NosanaNetwork.DEVNET]
  },
  [NosanaNetwork.LOCALNET]: {
    client_manager_url: 'http://localhost:3002',
    host_manager_url: 'http://localhost:3004',
    blockchain_indexer_url: 'http://localhost:3003',
    deployment_manager_url: 'http://localhost:3001',
    nos_address: NOS_MINT_ADDRESSES[NosanaNetwork.LOCALNET]
  }
};
