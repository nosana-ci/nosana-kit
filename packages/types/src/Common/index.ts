
export const NosanaNetwork = {
  MAINNET: 'mainnet',
  DEVNET: 'devnet',
} as const;

export type NosanaNetwork = (typeof NosanaNetwork)[keyof typeof NosanaNetwork];
