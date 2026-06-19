import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Base64EncodedWireTransaction } from '@solana/kit';
import { getScenarioClient, type Address } from '../../src/index.js';
import { JobsClient, JobState } from '@nosana/kit';

describe('scenario: jobs/market', () => {
  let marketAddress: Address;

  beforeEach(async () => {
    const client = await getScenarioClient();
    const openIx = await client.jobs.createMarket();
    await client.solana.buildSignAndSend(openIx);

    const parsed = JobsClient.parseOpenInstruction(openIx);
    marketAddress = parsed.accounts.market.address;
    if (!marketAddress) {
      throw new Error('Failed to resolve market address from open instruction.');
    }
  });

  afterEach(async () => {
    const client = await getScenarioClient();
    const closeIx = await client.jobs.closeMarket({ market: marketAddress });
    await client.solana.buildSignAndSend(closeIx);
  });

  it('creates a market', async () => {
    const client = await getScenarioClient();
    const market = await client.jobs.market(marketAddress);
    expect(market.address).toBe(marketAddress);
  });

  it('lists a job in a market', async () => {
    const client = await getScenarioClient();
    const listIx = await client.jobs.list({
      market: marketAddress,
      timeout: 3600,
      ipfsHash: 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p',
    });
    await client.solana.buildSignAndSend(listIx);

    const parsed = JobsClient.parseListInstruction(listIx);
    const jobAccount = parsed.accounts.job;
    const jobAddress = jobAccount.address;
    if (!jobAddress) {
      throw new Error('Failed to resolve job address from list instruction.');
    }

    const job = await client.jobs.get(jobAddress, false);
    expect(job.address).toBe(jobAddress);
    expect(job.state).toBe(JobState.QUEUED);
    expect(job.project).toBe(client.wallet!.address);
    expect(job.market).toBe(marketAddress);
  });

  it('build-and-signs a LIST batch, then a separate broadcast lands it (signBatch)', async () => {
    const client = await getScenarioClient();

    // Build + sign 7 LIST txs. Nothing is broadcast inside the kit.
    const signed = await client.jobs.signBatch(
      await client.jobs.listMany(
        {
          market: marketAddress,
          timeout: 3600,
          ipfsHash: 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p',
        },
        7
      )
    );

    expect(signed.length).toBeGreaterThan(0);
    for (const tx of signed) {
      expect(typeof tx.blob).toBe('string');
      expect(typeof tx.lastValidBlockHeight).toBe('bigint');
      expect(tx.accounts.jobs.length).toBeGreaterThan(0);

      // Multi-signer: every bucket is signed by all embedded signers — each list
      // contributes a fresh job + run keypair — plus the fee payer (2 per list + 1),
      // and every required signature is present in the blob.
      const decoded = await client.solana.deserializeTransaction(tx.blob);
      const listCount = tx.decoded.filter((d) => d?.name === 'list').length;
      expect(Object.keys(decoded.signatures)).toHaveLength(2 * listCount + 1);
      expect(Object.values(decoded.signatures).every((s) => s !== null)).toBe(true);
    }

    const createdJobs = signed.flatMap((tx) => tx.accounts.jobs);
    expect(createdJobs).toHaveLength(7);

    // Broadcast the blobs from OUTSIDE the kit (raw RPC) — proving they are
    // self-contained and broadcastable later by a separate process.
    for (const tx of signed) {
      await client.solana.rpc
        .sendTransaction(tx.blob as Base64EncodedWireTransaction, { encoding: 'base64' })
        .send();
    }

    // Wait for all jobs to land on-chain.
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if ((await client.jobs.all({ market: marketAddress })).length >= 7) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const onChain = await client.jobs.multiple(createdJobs);
    expect(onChain).toHaveLength(7);

    // Re-broadcasting an already-landed blob is a no-op: the chain dedups by
    // signature, so the same signature comes back and no duplicate job is created.
    const first = signed[0];
    const resentSignature = await client.solana.rpc
      .sendTransaction(first.blob as Base64EncodedWireTransaction, {
        encoding: 'base64',
        skipPreflight: true,
      })
      .send();
    expect(resentSignature).toBe(first.signature);
    expect((await client.jobs.all({ market: marketAddress })).length).toBe(7);

    // Clean up so afterEach can close the market.
    const delisted = await client.jobs.sendBatch(await client.jobs.delistMany(createdJobs));
    expect(delisted.every((r) => r.confirmed)).toBe(true);
  });
});
