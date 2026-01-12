import { Address } from '@solana/kit';

import type { getFinishInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';

export type FinishParams = {
  market: Address;
  nft?: Address;
};

export type FinishInstruction = ReturnType<typeof getFinishInstruction>;

export type Finish = (params: FinishParams) => Promise<FinishInstruction>;

export async function finish(
  params: FinishParams,
  { client }: InstructionsHelperParams
): Promise<FinishInstruction> {
  return client.getFinishInstruction({
    ...TODO,
  });
}
