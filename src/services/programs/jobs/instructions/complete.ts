import bs58 from 'bs58';
import type { Address } from '@solana/kit';

import type { getCompleteInstruction } from '../../../../generated_clients/jobs/index.js';
import type { InstructionsHelperParams } from './types.js';
import { JobState } from '../JobsProgram.js';

export type CompleteParams = {
  job: Address;
  ipfsResultsHash: string;
};

export type CompleteInstruction = ReturnType<typeof getCompleteInstruction>;

export type Complete = (params: CompleteParams) => Promise<CompleteInstruction>;

export async function complete(
  { job, ipfsResultsHash }: CompleteParams,
  { client, get, getRequiredWallet }: InstructionsHelperParams
): Promise<CompleteInstruction> {
  const wallet = getRequiredWallet();
  const { state } = await get(job);

  if (state !== JobState.STOPPED)
    throw new Error(
      `Cannot complete a job that has not been stopped. Current state: ${JobState[state]}`
    );

  return client.getCompleteInstruction({
    job,
    ipfsResult: bs58.decode(ipfsResultsHash).subarray(2),
    authority: wallet,
  });
}
