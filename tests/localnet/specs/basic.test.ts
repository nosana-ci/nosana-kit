import { describe, it, expect } from 'vitest';
import { getLocalnetClient } from '../helpers/setup.js';

describe('localnet basic', () => {
  it('has a valid payer account', async () => {
    const client = await getLocalnetClient();
    const payerAddress = client.wallet?.address;
    expect(payerAddress).toBeDefined();
    const info = await client.solana.rpc
      .getAccountInfo(payerAddress!, { encoding: 'base64' })
      .send();
    expect(info.value).not.toBeNull();
  });

  it('has jobs, stake, and rewards programs on localnet', async () => {
    const client = await getLocalnetClient();
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
