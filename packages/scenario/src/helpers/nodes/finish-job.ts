import { address, type NosanaClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export async function finishJob(jobAddress: string, clientOverride?: NosanaClient): Promise<void> {
  const client = await resolveClient(clientOverride);
  const job = address(jobAddress);

  const instruction = await client.jobs.finish({
    job,
    ipfsResultsHash: 'QmV2iq3gexzSwPAbhBAPVDip7Pu6k7whECUa4wzUjnPtdA',
  });
  const tx = await client.solana.buildSignAndSend(instruction);

  expect(tx).not.toBeNull();
}
