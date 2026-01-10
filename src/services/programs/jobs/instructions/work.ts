import { Address } from "@solana/kit";

import { getWorkInstruction } from "../../../../generated_clients/jobs/index.js";
import { InstructionsHelperParams } from "./types.js";

export type WorkParams = {
  market: Address;
  nft?: Address;
}

export type WorkInstruction = ReturnType<typeof getWorkInstruction>;

export type Work = (params: WorkParams) => Promise<WorkInstruction>;

export async function work(params: WorkParams, { client }: InstructionsHelperParams): Promise<WorkInstruction> {

  return client.getWorkInstruction({
    ...TODO
  });
}