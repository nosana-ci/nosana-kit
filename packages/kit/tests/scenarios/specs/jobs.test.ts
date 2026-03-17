import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getLocalnetClient } from '../helpers/setup.js';
import { Address, JobsClient, JobState } from '../../../src/index.js';

describe('localnet jobs/market', () => {
  let marketAddress: Address;

  beforeEach(async () => {
    const client = await getLocalnetClient();
    const openIx = await client.jobs.createMarket();
    await client.solana.buildSignAndSend(openIx);

    const parsed = JobsClient.parseOpenInstruction(openIx);
    marketAddress = parsed.accounts.market.address;
    if (!marketAddress) {
      throw new Error('Failed to resolve market address from open instruction.');
    }
  });

  afterEach(async () => {
    const client = await getLocalnetClient();
    const closeIx = await client.jobs.closeMarket({ market: marketAddress });
    await client.solana.buildSignAndSend(closeIx);
  });

  it('creates a market', async () => {
    const client = await getLocalnetClient();
    const market = await client.jobs.market(marketAddress);
    expect(market.address).toBe(marketAddress);
  });

  it('lists a job in a market', async () => {
    const client = await getLocalnetClient();
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
});
