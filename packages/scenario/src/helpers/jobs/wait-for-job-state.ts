import { address, JobState, type NosanaClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export async function waitForJobState(
  jobAddress: string,
  expectedState: JobState,
  clientOverride?: NosanaClient
): Promise<void> {
  const client = await resolveClient(clientOverride);
  const job = address(jobAddress);

  await expect
    .poll(
      async () => {
        const fetched = await client.jobs.get(job);
        return fetched?.state;
      },
      { message: `Waiting for job to reach ${expectedState} state` }
    )
    .toBe(expectedState);
}
