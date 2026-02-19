import type { PublicKey, Address } from "../index.js";
import type { GetPublicKeyOrAddress } from "../utils.js";

type PublicKeyOrAddress = GetPublicKeyOrAddress<PublicKey, Address>;

export type Job = {
  ipfsJob: string;
  ipfsResult: string;
  market: PublicKeyOrAddress;
  node: string;
  payer: PublicKeyOrAddress;
  price: number;
  project: PublicKeyOrAddress;
  state: string | number;
  timeEnd: number;
  timeStart: number;
  timeout: number;
};
