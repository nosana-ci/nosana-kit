import { address, type NosanaClient } from '@nosana/kit';
import { expect } from 'vitest';
import { resolveClient } from '../resolve-client.js';

export interface JoinMarketQueueOptions {
  verifyQueued?: boolean;
}

export async function joinMarketQueue(
  marketAddress: string,
  options: JoinMarketQueueOptions = {},
  clientOverride?: NosanaClient
): Promise<void> {
  const client = await resolveClient(clientOverride);
  const market = address(marketAddress);
  const { verifyQueued = true } = options;

  // Ensure the node has a valid stake account (even if empty)
  await ensureStakeAccount(client);

  const instruction = await client.jobs.work({ market });

  try {
    await client.solana.buildSignAndSend(instruction);
  } catch (error: unknown) {
    const err = error as {
      details?: { cause?: { context?: { code?: number } } };
      context?: { logs?: string[] };
    };
    const errorCode = err?.details?.cause?.context?.code;
    const errorLogs = err?.context?.logs || [];
    const hasNodeAlreadyQueued =
      errorCode === 6014 || errorLogs.some((log) => log.includes('NodeAlreadyQueued'));

    if (!hasNodeAlreadyQueued) {
      throw error;
    }
  }

  if (verifyQueued) {
    const marketAfter = await client.jobs.market(market);
    const nodeAddress = client.wallet!.address.toString();
    const queueAddresses = marketAfter.queue.map((addr) => addr.toString());
    expect(queueAddresses).toContain(nodeAddress);
  }
}

async function ensureStakeAccount(client: NosanaClient): Promise<void> {
  try {
    await client.stake.getByOwner();
  } catch {
    const instruction = await client.stake.stake({ amount: 0, days: 14 });
    await client.solana.buildSignAndSend(instruction);
  }
}
