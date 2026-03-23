import { address, type NosanaClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export async function closeMarket(
  marketAddress: string,
  clientOverride?: NosanaClient
): Promise<void> {
  const client = await resolveClient(clientOverride);
  const market = address(marketAddress);
  const instruction = await client.jobs.closeMarket({ market });
  const tx = await client.solana.buildSignAndSend(instruction);

  expect(tx).not.toBeNull();
}
