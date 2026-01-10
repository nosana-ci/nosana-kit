
import bs58 from "bs58";
import type { Address } from "@solana/kit";

import type { getCompleteInstruction } from "../../../../generated_clients/jobs/index.js";
import type { InstructionsHelperParams } from "./types.js";

export type CompleteParams = {
  job: Address
  ipfsResultsHash: string;
}

export type CompleteInstruction = ReturnType<typeof getCompleteInstruction>;

export type Complete = (params: CompleteParams) => Promise<CompleteInstruction>;

export async function complete({ job, ipfsResultsHash }: CompleteParams, { client, getRequiredWallet }: InstructionsHelperParams): Promise<CompleteInstruction> {
  const wallet = getRequiredWallet();

  return client.getCompleteInstruction({
    job,
    ipfsResult: bs58.decode(ipfsResultsHash).subarray(2),
    authority: wallet
  });
}