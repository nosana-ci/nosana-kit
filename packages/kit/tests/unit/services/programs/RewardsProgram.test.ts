import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBase64Decoder, type Address } from '@solana/kit';
import { getRewardAccountEncoder } from '@nosana/rewards-program';

import { createRewardsProgram } from '../../../../src/services/programs/rewards/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../setup/index.js';
import type { ProgramDeps } from '../../../../src/types.js';

describe('RewardsProgram', () => {
  let deps: ProgramDeps;
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];
  let rewards: ReturnType<typeof createRewardsProgram>;
  let wallet: Address;
  /** A PDA per seed count, so the accounts can be told apart. */
  const pdaFor = (seeds: string[]) => AddressFactory.create(seeds.length);

  /** The RPC's answer to the rewards account lookup: none, or the account given. */
  function rewardAccount(data?: {
    authority: Address;
    bump: number;
    reflection: bigint;
    xnos: bigint;
  }) {
    const bytes = data && getRewardAccountEncoder().encode(data);
    const value = bytes && {
      data: [getBase64Decoder().decode(bytes), 'base64'],
      executable: false,
      lamports: 1n,
      owner: config.programs.rewardsAddress,
      rentEpoch: 0n,
      space: BigInt(bytes.length),
    };
    (deps.solana.rpc as unknown as { getAccountInfo: unknown }).getAccountInfo = vi.fn(() => ({
      send: async () => ({ context: { slot: 1n }, value: value ?? null }),
    }));
  }

  beforeEach(() => {
    const sdk = MockClientFactory.createMockWithWallet();
    wallet = sdk.wallet!.address;
    (sdk.solana as unknown as { pda: unknown }).pda = vi.fn(async (seeds: string[]) =>
      pdaFor(seeds)
    );
    deps = sdkToProgramDeps(sdk);
    config = sdk.config;
    rewards = createRewardsProgram(deps, config.programs);
  });

  it('derives the rewards account from the owner, and the reflection account from none', async () => {
    const owner = AddressFactory.create(9);

    expect(await rewards.getAddress(owner)).toBe(pdaFor(['reward', owner]));
    expect(deps.solana.pda).toHaveBeenCalledWith(['reward', owner], config.programs.rewardsAddress);

    expect(await rewards.getAddress()).toBe(pdaFor(['reward', wallet]));
    expect(deps.solana.pda).toHaveBeenCalledWith(
      ['reward', wallet],
      config.programs.rewardsAddress
    );

    expect(await rewards.getReflectionAddress()).toBe(pdaFor(['reflection']));
    expect(deps.solana.pda).toHaveBeenCalledWith(['reflection'], config.programs.rewardsAddress);
  });

  it('builds the enter for the wallet’s stake on the rewards program', async () => {
    const instruction = await rewards.enter();

    expect(instruction.programAddress).toBe(config.programs.rewardsAddress);
    expect(instruction.accounts.slice(0, 4).map((account) => account.address)).toEqual([
      pdaFor(['reflection']),
      pdaFor(['stake', config.programs.nosTokenAddress, wallet]),
      pdaFor(['reward', wallet]),
      wallet,
    ]);
    expect(deps.solana.pda).toHaveBeenCalledWith(
      ['stake', config.programs.nosTokenAddress, wallet],
      config.programs.stakeAddress
    );
  });

  it('finds no rewards account for an owner without one', async () => {
    rewardAccount();

    expect(await rewards.find(wallet)).toBeUndefined();
  });

  it('finds the owner’s rewards account, its amounts as numbers', async () => {
    rewardAccount({ authority: wallet, bump: 254, reflection: 7n, xnos: 1_000_000n });

    expect(await rewards.find()).toEqual({
      address: pdaFor(['reward', wallet]),
      authority: wallet,
      bump: 254,
      reflection: 7,
      xnos: 1_000_000,
    });
  });

  it('needs a wallet to enter, or to find its own account', async () => {
    const sdk = MockClientFactory.createBasic();
    const noWallet = createRewardsProgram(sdkToProgramDeps(sdk), sdk.config.programs);

    await expect(noWallet.enter()).rejects.toThrow('Wallet is required');
    await expect(noWallet.find()).rejects.toThrow('Wallet is required');
  });
});
