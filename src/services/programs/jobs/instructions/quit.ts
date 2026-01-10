
import { Address } from "@solana/kit";

import { getQuitInstruction } from "../../../../generated_clients/jobs/index.js";
import { InstructionsHelperParams } from "./types.js";

export type QuitParams = {
  market: Address;
  nft?: Address;
}

export type QuitInstruction = ReturnType<typeof getQuitInstruction>;

export type Quit = (params: QuitParams) => Promise<QuitInstruction>;

export async function quit(params: QuitParams, { client }: InstructionsHelperParams): Promise<QuitInstruction> {

  return client.getQuitInstruction({
    ...TODO
  });
}