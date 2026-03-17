import type { Address } from '@solana/kit';
import { ipfsHashToSolBytesArray } from '@nosana/ipfs';

import type { getCompleteInstruction } from '@nosana/jobs-program';
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
  const jobAccount = await get(job);

  if (jobAccount.state !== JobState.COMPLETED)
    throw new Error(
      `Cannot complete a job that is not in state COMPLETED. Current state: ${JobState[jobAccount.state]}`
    );

  if (jobAccount.ipfsResult !== null) {
    throw new Error('Job has already been completed.');
  }

  return client.getCompleteInstruction({
    job,
    ipfsResult: new Uint8Array(ipfsHashToSolBytesArray(ipfsResultsHash)),
    authority: wallet,
  });
}
