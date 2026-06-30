import { describe, it, expect } from 'vitest';
import { getScenarioClient } from '../../src/index.js';

describe('scenario: basic', () => {
  it('has a valid payer account', async () => {
    const client = await getScenarioClient();
    const payerAddress = client.wallet?.address;
    expect(payerAddress).toBeDefined();
    const info = await client.solana.rpc
      .getAccountInfo(payerAddress!, { encoding: 'base64' })
      .send();
    expect(info.value).not.toBeNull();
  });

  it('has SOL and NOS balance', async () => {
    const client = await getScenarioClient();
    const solBalance = await client.solana.getBalance();
    const nosBalance = await client.nos.getBalance();
    expect(solBalance).toBeGreaterThan(0n);
    expect(nosBalance).toBeGreaterThan(0n);
  });

  it('has jobs, stake, and rewards programs', async () => {
    const client = await getScenarioClient();
    const jobsAddress = client.config.programs.jobsAddress;
    const stakeAddress = client.config.programs.stakeAddress;
    const rewardsAddress = client.config.programs.rewardsAddress;

    const jobsInfo = await client.solana.rpc
      .getAccountInfo(jobsAddress, { encoding: 'base64' })
      .send();
    const stakeInfo = await client.solana.rpc
      .getAccountInfo(stakeAddress, { encoding: 'base64' })
      .send();
    const rewardsInfo = await client.solana.rpc
      .getAccountInfo(rewardsAddress, { encoding: 'base64' })
      .send();

    expect(jobsInfo.value).not.toBeNull();
    expect(stakeInfo.value).not.toBeNull();
    expect(rewardsInfo.value).not.toBeNull();
  });
});
