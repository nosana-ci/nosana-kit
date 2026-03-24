
export const NosanaNetwork = {
  MAINNET: 'mainnet',
  DEVNET: 'devnet',
  LOCALNET: 'localnet',
} as const;

export type NosanaNetwork = (typeof NosanaNetwork)[keyof typeof NosanaNetwork];
