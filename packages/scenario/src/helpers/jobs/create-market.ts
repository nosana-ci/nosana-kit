import type { Address, NosanaClient, OpenParams } from '@nosana/kit';
import { JobsClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export async function createMarket(params: OpenParams = {}, clientOverride?: NosanaClient): Promise<Address> {
  const client = await resolveClient(clientOverride);
  const instruction = await client.jobs.createMarket(params);
  const tx = await client.solana.buildSignAndSend(instruction);

  const parsed = JobsClient.parseOpenInstruction(instruction);
  const marketAddress = parsed.accounts.market.address;

  expect(marketAddress).toBeDefined();
  expect(tx).not.toBeNull();

  return marketAddress;
}
