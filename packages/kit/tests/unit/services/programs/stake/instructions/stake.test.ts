import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Address } from '@solana/kit';

import { stake } from '../../../../../../src/services/programs/stake/instructions/stake.js';
import * as programClient from '@nosana/stake-program';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

const CUSTOM_AMOUNT = 1000;
const CUSTOM_DAYS = 30;

function createMockWallet(addr: Address) {
  return {
    address: addr,
    signMessages: async () => [],
    signTransactions: async () => [],
  } as any;
}

function createMockInstruction() {
  return {
    programAddress: AddressFactory.create(999),
    accounts: [],
    data: new Uint8Array([1]),
  };
}

describe('stake instruction', () => {
  let helperParams: Parameters<typeof stake>[1];
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];

  beforeEach(() => {
    const sdk = MockClientFactory.createBasic();
    const deps = sdkToProgramDeps(sdk);
    config = sdk.config;

    helperParams = {
      deps,
      config: config.programs,
      client: programClient,
      getRequiredWallet: () => {
        const wallet = deps.getWallet();
        if (!wallet) {
          throw new Error('Wallet is required');
        }
        return wallet;
      },
      getNosATA: sdk.nos.getATA.bind(sdk.nos),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates stake instruction with correct accounts', async () => {
    const walletAddr = AddressFactory.create(100);
    const vaultPda = AddressFactory.create(101);
    const nosAta = AddressFactory.create(103);
    const mintAddr = config.programs.nosTokenAddress;
    const wallet = createMockWallet(walletAddr);

    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    (helperParams.getNosATA as any) = vi.fn(async () => nosAta);

    const stakeSpy = vi
      .spyOn(programClient, 'getStakeInstruction' as any)
      .mockReturnValue(createMockInstruction());

    const instruction = await stake({ amount: 0, days: 0 }, helperParams);

    expect(stakeSpy).toHaveBeenCalled();
    const args = stakeSpy.mock.calls[0][0] as any;
    expect(args.mint).toBe(mintAddr);
    expect(args.user).toBe(nosAta);
    expect(args.authority).toBe(wallet);
    expect(args.amount).toBe(0);
    expect(args.duration).toBe(0);
    expect(args.vault).toBeDefined();
    expect(args.stake).toBeDefined();
    expect(instruction).toBeDefined();
  });

  it('creates stake instruction with custom amount and duration', async () => {
    const walletAddr = AddressFactory.create(110);
    const nosAta = AddressFactory.create(111);
    const wallet = createMockWallet(walletAddr);

    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.getNosATA as any) = vi.fn(async () => nosAta);

    const stakeSpy = vi
      .spyOn(programClient, 'getStakeInstruction' as any)
      .mockReturnValue(createMockInstruction());

    await stake({ amount: CUSTOM_AMOUNT, days: CUSTOM_DAYS }, helperParams);

    expect(stakeSpy).toHaveBeenCalled();
    const args = stakeSpy.mock.calls[0][0] as any;
    expect(args.amount).toBe(CUSTOM_AMOUNT);
    expect(args.duration).toBe(CUSTOM_DAYS * 86400);
  });

  it('derives vault and stake PDAs with correct seeds', async () => {
    const walletAddr = AddressFactory.create(120);
    const vaultPda = AddressFactory.create(121);
    const mintAddr = config.programs.nosTokenAddress;
    const stakeAddr = config.programs.stakeAddress;
    const wallet = createMockWallet(walletAddr);

    (helperParams.deps.getWallet as any) = () => wallet;
    const pdaSpy = ((helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda));

    vi.spyOn(programClient, 'getStakeInstruction' as any).mockReturnValue(createMockInstruction());

    await stake({ amount: 0, days: 0 }, helperParams);

    expect(pdaSpy).toHaveBeenCalledTimes(2);

    // Vault PDA: ['vault', mint, wallet.address]
    const vaultCall = pdaSpy.mock.calls[0] as unknown as [Address[], Address];
    expect(vaultCall[0]).toEqual(['vault', mintAddr, walletAddr]);
    expect(vaultCall[1]).toBe(stakeAddr);

    // Stake PDA: ['stake', mint, wallet.address]
    const stakeCall = pdaSpy.mock.calls[1] as unknown as [Address[], Address];
    expect(stakeCall[0]).toEqual(['stake', mintAddr, walletAddr]);
    expect(stakeCall[1]).toBe(stakeAddr);
  });

  it('throws when wallet is not available', async () => {
    (helperParams.deps.getWallet as any) = () => undefined;

    await expect(stake({ amount: 0, days: 0 }, helperParams)).rejects.toThrow('Wallet is required');
  });
});
