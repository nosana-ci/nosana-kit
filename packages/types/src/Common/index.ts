
export const NosanaNetwork = {
  MAINNET: 'mainnet',
  DEVNET: 'devnet',
  LOCALNET: 'localnet',
} as const;

export type NosanaNetwork = (typeof NosanaNetwork)[keyof typeof NosanaNetwork];

/**
 * The NOS token mint address per network. Single source of truth for all
 * packages; localnet uses the devnet mint (pre-baked in @nosana/localnet).
 */
export const NOS_MINT_ADDRESSES: Record<NosanaNetwork, string> = {
  [NosanaNetwork.MAINNET]: 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',
  [NosanaNetwork.DEVNET]: 'devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP',
  [NosanaNetwork.LOCALNET]: 'devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP',
} as const;

/**
 * Nosana program addresses per network. Single source of truth for all
 * packages; localnet runs the devnet programs (pre-baked in @nosana/localnet).
 */
export const NOSANA_PROGRAM_ADDRESSES: Record<
  NosanaNetwork,
  {
    jobs: string;
    rewards: string;
    stake: string;
    pools: string;
    merkleDistributor: string;
  }
> = {
  [NosanaNetwork.MAINNET]: {
    jobs: 'nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM',
    rewards: 'nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp',
    stake: 'nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE',
    pools: 'nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD',
    merkleDistributor: 'merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425',
  },
  [NosanaNetwork.DEVNET]: {
    jobs: 'nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR',
    rewards: 'nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp',
    stake: 'nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE',
    pools: 'nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD',
    merkleDistributor: 'merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425',
  },
  [NosanaNetwork.LOCALNET]: {
    jobs: 'nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR',
    rewards: 'nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp',
    stake: 'nosScmHY2uR24Zh751PmGj9ww9QRNHewh9H59AfrTJE',
    pools: 'nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD',
    merkleDistributor: 'merkp8F8f5EgYSYKadk3YiuQQdo3JPdnJWKviaaF425',
  },
} as const;
