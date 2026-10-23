import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getScenarioClient, type Address } from '../../src/index.js';
import { JobsClient } from '@nosana/kit';

describe('scenario: market settings', () => {
  let marketAddress: Address;

  beforeEach(async () => {
    const client = await getScenarioClient();
    const openIx = await client.jobs.createMarket();
    await client.solana.buildSignAndSend(openIx);
    marketAddress = JobsClient.parseOpenInstruction(openIx).accounts.market.address;
  });

  afterEach(async () => {
    const client = await getScenarioClient();
    if (await client.jobs.marketSettings(marketAddress)) {
      const closeSettingsIx = await client.jobs.closeMarketSettings({ market: marketAddress });
      await client.solana.buildSignAndSend(closeSettingsIx);
    }
    const closeIx = await client.jobs.closeMarket({ market: marketAddress });
    await client.solana.buildSignAndSend(closeIx);
  });

  it('has no settings on a new market', async () => {
    const client = await getScenarioClient();
    expect(await client.jobs.marketSettings(marketAddress)).toBeNull();
  });

  it('protects a market with a project access key and opens it again', async () => {
    const client = await getScenarioClient();
    const projectAccessKey = client.wallet!.address;

    // protect the market
    const setIx = await client.jobs.setMarketSettings({ market: marketAddress, projectAccessKey });
    await client.solana.buildSignAndSend(setIx);

    const settings = await client.jobs.marketSettings(marketAddress);
    expect(settings?.market).toBe(marketAddress);
    expect(settings?.projectAccessKey).toBe(projectAccessKey);

    // a wallet without an NFT of the access key collection cannot post
    await expect(
      client.jobs.list({
        market: marketAddress,
        timeout: 3600,
        ipfsHash: 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p',
      })
    ).rejects.toThrow('holds no access key NFT');

    // open the market again
    const closeIx = await client.jobs.closeMarketSettings({ market: marketAddress });
    await client.solana.buildSignAndSend(closeIx);
    expect(await client.jobs.marketSettings(marketAddress)).toBeNull();

    // posting works again
    const openListIx = await client.jobs.list({
      market: marketAddress,
      timeout: 3600,
      ipfsHash: 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p',
    });
    await client.solana.buildSignAndSend(openListIx);
    const job = JobsClient.parseListInstruction(openListIx).accounts.job.address;
    const delistIx = await client.jobs.delist({ job });
    await client.solana.buildSignAndSend(delistIx);
  });

  it('only lets the market authority set the settings', async () => {
    const client = await getScenarioClient();
    const other = await getScenarioClient({ key: 'other-project' });

    const setIx = await other.jobs.setMarketSettings({
      market: marketAddress,
      projectAccessKey: other.wallet!.address,
    });
    await expect(other.solana.buildSignAndSend(setIx)).rejects.toThrow();
    expect(await client.jobs.marketSettings(marketAddress)).toBeNull();
  });
});
