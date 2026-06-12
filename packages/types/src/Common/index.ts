
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
