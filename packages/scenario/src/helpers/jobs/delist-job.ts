import { address, type NosanaClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export async function delistJob(jobAddress: string, clientOverride?: NosanaClient): Promise<void> {
  const client = await resolveClient(clientOverride);
  const job = address(jobAddress);

  const instruction = await client.jobs.delist({ job });
  const tx = await client.solana.buildSignAndSend(instruction);

  expect(tx).not.toBeNull();
}
