import type { PublicKey, Address } from "../index.js";
import type { GetPublicKeyOrAddress, EnumValues } from "../utils.js";

type PublicKeyOrAddress = GetPublicKeyOrAddress<PublicKey, Address>;

export const MarketQueue = {
  "JOB_QUEUE": 0,
  "NODE_QUEUE": 1,
  "EMPTY": undefined
} as const;

export type MarketQueue = EnumValues<typeof MarketQueue>

export type Market = {
  address: PublicKeyOrAddress;
  authority: PublicKeyOrAddress;
  jobExpiration: number;
  jobPrice: number;
  jobTimeout: number;
  jobType: number;
  vault: PublicKeyOrAddress;
  vaultBump: number;
  nodeAccessKey: PublicKeyOrAddress;
  nodeXnosMinimum: number;
  queueType: MarketQueue;
  queue: Array<PublicKeyOrAddress>;
};
