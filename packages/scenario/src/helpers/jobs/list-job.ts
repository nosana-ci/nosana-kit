import type { Address, ListParams, NosanaClient } from '@nosana/kit';
import { JobsClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

const DEFAULT_TIMEOUT = 3600;
const DEFAULT_IPFS_HASH = 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p';

export async function listJob(
  params: Omit<ListParams, 'timeout' | 'ipfsHash'> & Partial<Pick<ListParams, 'timeout' | 'ipfsHash'>>,
  clientOverride?: NosanaClient,
): Promise<Address> {
  const client = await resolveClient(clientOverride);
  const instruction = await client.jobs.list({
    timeout: DEFAULT_TIMEOUT,
    ipfsHash: DEFAULT_IPFS_HASH,
    ...params,
  });
  const tx = await client.solana.buildSignAndSend(instruction);

  const parsed = JobsClient.parseListInstruction(instruction);
  const jobAddress = parsed.accounts.job.address;

  expect(jobAddress).toBeDefined();
  expect(tx).not.toBeNull();

  return jobAddress;
}
