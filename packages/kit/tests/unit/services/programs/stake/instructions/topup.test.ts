import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AccountRole,
  address,
  getAddressEncoder,
  getBase64Decoder,
  getProgramDerivedAddress,
  getUtf8Encoder,
  type Address,
} from '@solana/kit';

import { topup } from '../../../../../../src/services/programs/stake/instructions/topup.js';
import { createSolanaService } from '../../../../../../src/services/solana/SolanaService.js';
import { DEFAULT_CONFIGS } from '../../../../../../src/config/index.js';
import * as stakeClient from '@nosana/stake-program';
import * as rewardsClient from '@nosana/rewards-program';
import * as poolsClient from '@nosana/pools-program';
import {
  AddressFactory,
  MockClientFactory,
  SignerFactory,
  sdkToProgramDeps,
} from '../../../../setup/index.js';
import type { Wallet } from '../../../../../../src/types.js';

const programs = DEFAULT_CONFIGS.mainnet.programs;
// The mainnet default rewards pool (programs.rewardsPoolAddress).
const POOL = address('5SdnB8ZMqqfVKPUHFqx3KVfx4Aj4y352uCe8C71GHUqU');
// The mainnet rewards vault: the beneficiary of the AddFee pools on chain.
const MAINNET_REWARDS_VAULT = address('37xZ4jY3bSMBgxwekwdALRZK1kAUCh7YkkPabA4P2tq8');
const TOKEN_PROGRAM = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const SYSTEM_PROGRAM = address('11111111111111111111111111111111');

async function pda(seeds: Array<string | Address>, programAddress: Address): Promise<Address> {
  const [found] = await getProgramDerivedAddress({
    programAddress,
    seeds: seeds.map((seed) =>
      seed.length >= 32
        ? getAddressEncoder().encode(seed as Address)
        : getUtf8Encoder().encode(seed)
    ),
  });
  return found;
}

function accountInfoResponse(data: Uint8Array | null, owner: Address) {
  if (!data) return { value: null };
  return {
    value: {
      data: [getBase64Decoder().decode(data), 'base64'],
      executable: false,
      lamports: 1_000_000n,
      owner,
      space: BigInt(data.length),
      rentEpoch: 0n,
    },
  };
}

function metas(instruction: { accounts?: readonly { address: Address; role: AccountRole }[] }) {
  return (instruction.accounts ?? []).map(({ address, role }) => ({ address, role }));
}

describe('topup instructions', () => {
  let wallet: Wallet;
  let userAta: Address;
  let helperParams: Parameters<typeof topup>[1];
  let rewardAccountData: Uint8Array | null;
  let expected: {
    vault: Address;
    stake: Address;
    reward: Address;
    reflection: Address;
    rewardsVault: Address;
    poolVault: Address;
  };

  beforeEach(async () => {
    wallet = await SignerFactory.createTestSigner();
    userAta = AddressFactory.create(200);
    rewardAccountData = null;

    const sdk = MockClientFactory.createBasic();
    const deps = sdkToProgramDeps(sdk);
    const solana = createSolanaService(
      { logger: deps.logger, getWallet: () => wallet },
      DEFAULT_CONFIGS.mainnet.solana
    );
    (deps.solana as any).pda = solana.pda;
    (deps.solana as any).rpc = {
      getAccountInfo: vi.fn(() => ({
        send: async () => accountInfoResponse(rewardAccountData, programs.rewardsAddress),
      })),
    };

    helperParams = {
      deps,
      config: programs,
      client: stakeClient,
      getRequiredWallet: () => wallet,
      getNosATA: vi.fn(async () => userAta),
    };

    const mint = programs.nosTokenAddress;
    expected = {
      vault: await pda(['vault', mint, wallet.address], programs.stakeAddress),
      stake: await pda(['stake', mint, wallet.address], programs.stakeAddress),
      reward: await pda(['reward', wallet.address], programs.rewardsAddress),
      reflection: await pda(['reflection'], programs.rewardsAddress),
      rewardsVault: await pda([mint], programs.rewardsAddress),
      poolVault: await pda(['vault', POOL], programs.poolsAddress),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('derives the mainnet rewards vault', () => {
    expect(expected.rewardsVault).toBe(MAINNET_REWARDS_VAULT);
  });

  it('builds enter, claimFee, topup, sync when the wallet has no rewards account', async () => {
    const instructions = await topup({ amount: 1_000_000, pool: POOL }, helperParams);

    expect(instructions).toHaveLength(4);
    const [enter, claimFee, topupIx, sync] = instructions as [any, any, any, any];

    expect(helperParams.deps.solana.rpc.getAccountInfo).toHaveBeenCalledWith(
      expected.reward,
      expect.anything()
    );
    expect(helperParams.getNosATA).toHaveBeenCalledWith(wallet.address);

    expect(enter.programAddress).toBe(programs.rewardsAddress);
    expect(rewardsClient.identifyNosanaRewardsInstruction(enter)).toBe(
      rewardsClient.NosanaRewardsInstruction.Enter
    );
    expect(metas(enter)).toEqual([
      { address: expected.reflection, role: AccountRole.WRITABLE },
      { address: expected.stake, role: AccountRole.READONLY },
      { address: expected.reward, role: AccountRole.WRITABLE },
      { address: wallet.address, role: AccountRole.WRITABLE_SIGNER },
      { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
    ]);

    expect(claimFee.programAddress).toBe(programs.poolsAddress);
    expect(poolsClient.identifyNosanaPoolsInstruction(claimFee)).toBe(
      poolsClient.NosanaPoolsInstruction.ClaimFee
    );
    expect(metas(claimFee)).toEqual([
      { address: expected.poolVault, role: AccountRole.WRITABLE },
      { address: expected.reflection, role: AccountRole.WRITABLE },
      { address: expected.rewardsVault, role: AccountRole.WRITABLE },
      { address: POOL, role: AccountRole.WRITABLE },
      { address: wallet.address, role: AccountRole.WRITABLE_SIGNER },
      { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
      { address: programs.rewardsAddress, role: AccountRole.READONLY },
    ]);

    expect(topupIx.programAddress).toBe(programs.stakeAddress);
    expect(stakeClient.identifyNosanaStakingInstruction(topupIx)).toBe(
      stakeClient.NosanaStakingInstruction.Topup
    );
    expect(metas(topupIx)).toEqual([
      { address: userAta, role: AccountRole.WRITABLE },
      { address: expected.vault, role: AccountRole.WRITABLE },
      { address: expected.stake, role: AccountRole.WRITABLE },
      { address: wallet.address, role: AccountRole.READONLY_SIGNER },
      { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
    ]);

    expect(sync.programAddress).toBe(programs.rewardsAddress);
    expect(rewardsClient.identifyNosanaRewardsInstruction(sync)).toBe(
      rewardsClient.NosanaRewardsInstruction.Sync
    );
    expect(metas(sync)).toEqual([
      { address: expected.reward, role: AccountRole.WRITABLE },
      { address: expected.stake, role: AccountRole.READONLY },
      { address: expected.reflection, role: AccountRole.WRITABLE },
    ]);
  });

  it('builds claimFee, topup, sync when the wallet already has a rewards account', async () => {
    rewardAccountData = new Uint8Array(
      rewardsClient.getRewardAccountEncoder().encode({
        authority: wallet.address,
        bump: 255,
        reflection: 1n,
        xnos: 1n,
      })
    );

    const instructions = await topup({ amount: 1_000_000, pool: POOL }, helperParams);

    expect(instructions).toHaveLength(3);
    expect(instructions.map((ix) => ix.programAddress)).toEqual([
      programs.poolsAddress,
      programs.stakeAddress,
      programs.rewardsAddress,
    ]);
    const [claimFee, topupIx, sync] = instructions as [any, any, any];
    expect(poolsClient.identifyNosanaPoolsInstruction(claimFee)).toBe(
      poolsClient.NosanaPoolsInstruction.ClaimFee
    );
    expect(stakeClient.identifyNosanaStakingInstruction(topupIx)).toBe(
      stakeClient.NosanaStakingInstruction.Topup
    );
    expect(rewardsClient.identifyNosanaRewardsInstruction(sync)).toBe(
      rewardsClient.NosanaRewardsInstruction.Sync
    );
  });

  it.each([
    ['a number', 1_000_000, 1_000_000n],
    ['a bigint', 25_000_000_000n, 25_000_000_000n],
    ['the u64 maximum', 18_446_744_073_709_551_615n, 18_446_744_073_709_551_615n],
  ])('encodes the topup amount given as %s', async (_label, amount, encoded) => {
    rewardAccountData = new Uint8Array(
      rewardsClient.getRewardAccountEncoder().encode({
        authority: wallet.address,
        bump: 255,
        reflection: 0n,
        xnos: 0n,
      })
    );

    const [, topupIx] = await topup({ amount, pool: POOL }, helperParams);
    const data = topupIx.data as Uint8Array;

    expect(data).toHaveLength(16);
    expect(Array.from(data.slice(0, 8))).toEqual(Array.from(stakeClient.TOPUP_DISCRIMINATOR));
    expect(new DataView(data.buffer, data.byteOffset + 8, 8).getBigUint64(0, true)).toBe(encoded);
    expect(stakeClient.getTopupInstructionDataDecoder().decode(data).amount).toBe(encoded);
  });

  describe('rewards pool', () => {
    const { pool: POOL_INDEX, vault: POOL_VAULT_INDEX } =
      poolsClient.CLAIM_FEE_INSTRUCTION_ACCOUNTS;

    async function claimFeeAccounts(params: Parameters<typeof topup>[0]) {
      const instructions = await topup(params, helperParams);
      const claimFee = instructions.find(
        (ix) => ix.programAddress === programs.poolsAddress
      ) as any;
      return {
        pool: claimFee.accounts[POOL_INDEX].address,
        vault: claimFee.accounts[POOL_VAULT_INDEX].address,
      };
    }

    it('has a default per network, unset on localnet', () => {
      expect(DEFAULT_CONFIGS.mainnet.programs.rewardsPoolAddress).toBe(
        '5SdnB8ZMqqfVKPUHFqx3KVfx4Aj4y352uCe8C71GHUqU'
      );
      expect(DEFAULT_CONFIGS.devnet.programs.rewardsPoolAddress).toBe(
        'miF9saGY5WS747oia48WR3CMFZMAGG8xt6ajB7rdV3e'
      );
      expect(DEFAULT_CONFIGS.localnet.programs.rewardsPoolAddress).toBeUndefined();
    });

    it('defaults to programs.rewardsPoolAddress from the config', async () => {
      const accounts = await claimFeeAccounts({ amount: 1 });

      expect(accounts.pool).toBe(programs.rewardsPoolAddress);
      expect(accounts.vault).toBe(
        await pda(['vault', programs.rewardsPoolAddress!], programs.poolsAddress)
      );
    });

    it('uses a configured rewardsPoolAddress override', async () => {
      const configured = address('Djy1xNoPnuUdHUTCkzEDQkxo3EpPJxXU7GbXEHXJfcEB');
      helperParams.config = { ...programs, rewardsPoolAddress: configured };

      const accounts = await claimFeeAccounts({ amount: 1 });

      expect(accounts.pool).toBe(configured);
      expect(accounts.vault).toBe(await pda(['vault', configured], programs.poolsAddress));
    });

    it('lets the call override the configured pool', async () => {
      const override = address('HES33F37n7sUkweDubLzs9NaSxKpRVPnuELGB4WQdmmx');

      const accounts = await claimFeeAccounts({ amount: 1, pool: override });

      expect(accounts.pool).toBe(override);
      expect(accounts.vault).toBe(await pda(['vault', override], programs.poolsAddress));
    });

    it('throws when neither the call nor the config names a pool', async () => {
      helperParams.config = { ...programs, rewardsPoolAddress: undefined };

      await expect(topup({ amount: 1 }, helperParams)).rejects.toThrow('No rewards pool');
    });
  });

  it('throws when wallet is not available', async () => {
    helperParams.getRequiredWallet = () => {
      throw new Error('Wallet is required');
    };

    await expect(topup({ amount: 1, pool: POOL }, helperParams)).rejects.toThrow(
      'Wallet is required'
    );
  });
});
