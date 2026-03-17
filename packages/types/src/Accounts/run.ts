import type { PublicKey, Address } from "../index.js";
import type { GetPublicKeyOrAddress } from "../utils.js";

type PublicKeyOrAddress = GetPublicKeyOrAddress<PublicKey, Address>;
export type Run = {
  account: {
    job: PublicKeyOrAddress;
    node: PublicKeyOrAddress;
    payer: PublicKeyOrAddress;
    state: number;
    time: number;
  };
  publicKey: PublicKeyOrAddress;
};