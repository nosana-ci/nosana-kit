import { NosanaNetwork, type Config } from "../types.js";

export const defaultConfig: Record<typeof NosanaNetwork[keyof typeof NosanaNetwork], Config> = {
  [NosanaNetwork.MAINNET]: {
    backend_url: 'https://dashboard.k8s.prd.nos.ci',
    nos_address: 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7'
  },
  [NosanaNetwork.DEVNET]: {
    backend_url: 'https://dashboard.k8s.dev.nos.ci',
    nos_address: 'devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP'
  }
};
