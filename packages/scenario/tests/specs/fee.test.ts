import { describe, expect, it } from 'vitest';
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  TOKEN_PROGRAM_ADDRESS,
} from '@solana-program/token';
import { JobsClient } from '@nosana/kit';
import { getScenarioClient, type Address } from '../../src/index.js';

const JOB_PRICE = 1_000_000n; // raw NOS per second
const JOB_TIMEOUT = 60;
const EXTENSION = 30;
const IPFS_HASH = 'QmVp8m3Uq1Cm6JJ3NsuTMSGLNnqXa1mC85uV7YxBREQ78p';

// Runs against either jobs program release: the job's `feeFraction` is 0 before the fee release.
describe('scenario: network fee', () => {
  it('settles a priced job: the node is paid its run time, the fee vault the fee on top', async () => {
    const client = await getScenarioClient();
    const wallet = client.wallet!;
    const { feeWalletAddress, nosTokenAddress } = client.config.programs;

    // The fee release needs the fee wallet's NOS account; it is created once, at deploy.
    await client.solana.buildSignAndSend(
      await getCreateAssociatedTokenIdempotentInstructionAsync({
        payer: wallet,
        owner: feeWalletAddress,
        mint: nosTokenAddress,
      })
    );
    const [feeVault] = await findAssociatedTokenPda({
      mint: nosTokenAddress,
      owner: feeWalletAddress,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    const tokens = async (account: Address) =>
      BigInt((await client.solana.rpc.getTokenAccountBalance(account).send()).value.amount);

    // A priced market with the wallet queued as its node, so it is both project and node.
    const openIx = await client.jobs.createMarket({ jobPrice: JOB_PRICE, jobTimeout: JOB_TIMEOUT });
    await client.solana.buildSignAndSend(openIx);
    const market = JobsClient.parseOpenInstruction(openIx).accounts.market.address;
    try {
      await client.stake.getByOwner();
    } catch {
      await client.solana.buildSignAndSend(await client.stake.stake({ amount: 0, days: 14 }));
    }
    await client.solana.buildSignAndSend(await client.jobs.work({ market }));

    const walletBefore = await client.nos.getBalance();
    const feeVaultBefore = await tokens(feeVault);

    const assignIx = await client.jobs.assign({
      market,
      node: wallet.address,
      timeout: JOB_TIMEOUT,
      ipfsHash: IPFS_HASH,
    });
    await client.solana.buildSignAndSend(assignIx);
    const job = JobsClient.parseAssignInstruction(assignIx).accounts.job.address;
    await client.solana.buildSignAndSend(await client.jobs.extend({ job, timeout: EXTENSION }));

    // Let the job run so the node is owed something, then settle it.
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await client.solana.buildSignAndSend(
      await client.jobs.finish({ job, ipfsResultsHash: IPFS_HASH })
    );

    const { feeFraction, timeStart, timeEnd, timeout } = await client.jobs.get(job, false);
    const payout = JOB_PRICE * BigInt(Math.min(timeEnd - timeStart, timeout));
    const fee = feeFraction ? payout / BigInt(feeFraction) : 0n;

    expect(payout).toBeGreaterThan(0n);
    expect((await tokens(feeVault)) - feeVaultBefore).toBe(fee);
    // the wallet paid the escrow, then got the payout as node and the rest back as payer
    expect(await client.nos.getBalance()).toBe(walletBefore - fee);

    await client.solana.buildSignAndSend(await client.jobs.closeMarket({ market }));
  }, 60_000);
});
