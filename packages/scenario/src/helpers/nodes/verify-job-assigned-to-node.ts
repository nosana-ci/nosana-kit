import { address, type NosanaClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export type VerifyJobAssignedOptions = {
  expectedState?: number;
};

export async function verifyJobAssignedToNode(
  jobAddress: string,
  options?: VerifyJobAssignedOptions,
  clientOverride?: NosanaClient
): Promise<void> {
  const client = await resolveClient(clientOverride);
  const job = address(jobAddress);
  const { state, node } = await client.jobs.get(job);
  const nodeAddress = client.wallet!.address.toString();

  expect(node).toBe(nodeAddress);

  if (options?.expectedState !== undefined) {
    expect(state).toBe(options.expectedState);
  }
}
