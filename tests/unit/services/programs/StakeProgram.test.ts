import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createStakeProgram,
  type StakeProgram,
} from '../../../../src/services/programs/StakeProgram.js';
import * as stakingClient from '../../../../src/generated_clients/staking/index.js';
import { type Address } from '@solana/kit';
import {
  AddressFactory,
  MockClientFactory,
  StakeAccountFactory,
  sdkToProgramDeps,
} from '../../helpers/index.js';

// Test constants
const DEFAULT_STAKE_AMOUNT = 1000;
const DEFAULT_XNOS = 1000;
const DEFAULT_DURATION = 2592000; // 30 days in seconds
const DEFAULT_TIME_UNSTAKE = 0;
const DEFAULT_VAULT_BUMP = 255;
const CUSTOM_STAKE_AMOUNT = 5000;
const CUSTOM_STAKE_AMOUNT_LARGE = 10000;
const CUSTOM_DURATION = 5184000; // 60 days
const CUSTOM_TIME_UNSTAKE = 1234567890;
const CUSTOM_XNOS = 15000;
const CUSTOM_VAULT_BUMP = 254;

// Helper functions
const baseSdk = () => MockClientFactory.createBasic();
const newAddr = (seed?: number) => AddressFactory.create(seed);
const makeStakeAccount = (amount?: number, addr?: Address) =>
  StakeAccountFactory.createWithAmount(amount ?? DEFAULT_STAKE_AMOUNT, { address: addr });

describe('StakeProgram', () => {
  describe('initialization', () => {
    it('should initialize with SDK and expose required methods', () => {
      const sdk = baseSdk();
      const deps = {
        logger: sdk.logger,
        solana: sdk.solana,
        getWallet: () => sdk.wallet,
      };
      const stake = createStakeProgram(deps, sdk.config.programs);

      // Assert - observable behavior: all required methods are available
      expect(stake).toBeDefined();
      expect(typeof stake.get).toBe('function');
      expect(typeof stake.multiple).toBe('function');
      expect(typeof stake.all).toBe('function');
    });

    it('should use program ID from config when fetching all stakes', async () => {
      const sdk = baseSdk();
      const deps = {
        logger: sdk.logger,
        solana: sdk.solana,
        getWallet: () => sdk.wallet,
      };
      const stake = createStakeProgram(deps, sdk.config.programs);

      sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
        send: vi.fn().mockResolvedValue([]),
      })) as any;

      await stake.all();

      // Assert - observable behavior: uses correct program ID
      expect(sdk.solana.rpc.getProgramAccounts).toHaveBeenCalledWith(
        sdk.config.programs.stakeAddress,
        expect.any(Object)
      );
    });
  });

  describe('transforms', () => {
    let stake: StakeProgram;

    beforeEach(() => {
      const sdk = baseSdk();
      const deps = {
        logger: sdk.logger,
        solana: sdk.solana,
        getWallet: () => sdk.wallet,
      };
      stake = createStakeProgram(deps, sdk.config.programs);
    });

    it('get converts bigint to numbers and includes address', async () => {
      const addr = newAddr(100);
      const acc = makeStakeAccount(CUSTOM_STAKE_AMOUNT, addr);

      vi.spyOn(stakingClient, 'fetchStakeAccount' as any).mockResolvedValue(acc);

      const out = await stake.get(addr);

      expect(out.address).toBe(acc.address);
      expect(out.amount).toBe(CUSTOM_STAKE_AMOUNT);
      expect(out.xnos).toBe(DEFAULT_XNOS);
      expect(out.duration).toBe(DEFAULT_DURATION);
      expect(out.timeUnstake).toBe(DEFAULT_TIME_UNSTAKE);
      expect(out.vaultBump).toBe(DEFAULT_VAULT_BUMP);
      expect(typeof out.amount).toBe('number');
      expect(typeof out.xnos).toBe('number');
      expect(typeof out.duration).toBe('number');
      expect(typeof out.timeUnstake).toBe('number');
    });

    it('get handles all stake account fields', async () => {
      const addr = newAddr(101);
      const customAuthority = newAddr(200);
      const customVault = newAddr(201);
      const acc = StakeAccountFactory.create({
        address: addr,
        amount: BigInt(CUSTOM_STAKE_AMOUNT_LARGE),
        authority: customAuthority,
        duration: BigInt(CUSTOM_DURATION),
        timeUnstake: BigInt(CUSTOM_TIME_UNSTAKE),
        vault: customVault,
        vaultBump: CUSTOM_VAULT_BUMP,
        xnos: BigInt(CUSTOM_XNOS),
      });

      vi.spyOn(stakingClient, 'fetchStakeAccount' as any).mockResolvedValue(acc);

      const out = await stake.get(addr);

      expect(out.address).toBe(acc.address);
      expect(out.amount).toBe(CUSTOM_STAKE_AMOUNT_LARGE);
      expect(out.authority).toBe(customAuthority);
      expect(out.duration).toBe(CUSTOM_DURATION);
      expect(out.timeUnstake).toBe(CUSTOM_TIME_UNSTAKE);
      expect(out.vault).toBe(customVault);
      expect(out.vaultBump).toBe(CUSTOM_VAULT_BUMP);
      expect(out.xnos).toBe(CUSTOM_XNOS);
    });
  });

  describe('methods', () => {
    let sdk: ReturnType<typeof MockClientFactory.createMockWithRpc>['sdk'];
    let stake: StakeProgram;

    beforeEach(() => {
      const ctx = MockClientFactory.createMockWithRpc();
      sdk = ctx.sdk;
      stake = createStakeProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    describe('get', () => {
      it('should fetch and transform a single stake account', async () => {
        const addr = newAddr(300);
        const stakeAmount = 7500;
        const mockStake = makeStakeAccount(stakeAmount, addr);

        vi.spyOn(stakingClient, 'fetchStakeAccount' as any).mockResolvedValue(mockStake);

        const result = await stake.get(addr);

        expect(result.address).toBe(addr);
        expect(result.amount).toBe(stakeAmount);
        expect(result.xnos).toBe(DEFAULT_XNOS);
        expect(stakingClient.fetchStakeAccount).toHaveBeenCalledWith(sdk.solana.rpc, addr);
      });

      it('should handle errors when fetching stake', async () => {
        const addr = newAddr(301);
        const error = new Error('Account not found');

        vi.spyOn(stakingClient, 'fetchStakeAccount' as any).mockRejectedValue(error);

        await expect(stake.get(addr)).rejects.toThrow('Account not found');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch stake')
        );
      });
    });

    describe('multiple', () => {
      it('should fetch and transform multiple stake accounts', async () => {
        const addresses = [newAddr(400), newAddr(401), newAddr(402)];
        const mockStakes = addresses.map((addr, i) =>
          makeStakeAccount((i + 1) * DEFAULT_STAKE_AMOUNT, addr)
        );

        vi.spyOn(stakingClient, 'fetchAllStakeAccount' as any).mockResolvedValue(mockStakes);

        const result = await stake.multiple(addresses);

        expect(result).toHaveLength(3);
        expect(result[0].amount).toBe(DEFAULT_STAKE_AMOUNT);
        expect(result[1].amount).toBe(DEFAULT_STAKE_AMOUNT * 2);
        expect(result[2].amount).toBe(DEFAULT_STAKE_AMOUNT * 3);
        expect(result[0].address).toBe(addresses[0]);
        expect(result[1].address).toBe(addresses[1]);
        expect(result[2].address).toBe(addresses[2]);
        expect(stakingClient.fetchAllStakeAccount).toHaveBeenCalledWith(sdk.solana.rpc, addresses);
      });

      it('should handle empty array', async () => {
        vi.spyOn(stakingClient, 'fetchAllStakeAccount' as any).mockResolvedValue([]);

        const result = await stake.multiple([]);

        expect(result).toHaveLength(0);
      });

      it('should handle errors when fetching multiple stakes', async () => {
        const addresses = [newAddr(403)];
        const error = new Error('RPC error');

        vi.spyOn(stakingClient, 'fetchAllStakeAccount' as any).mockRejectedValue(error);

        await expect(stake.multiple(addresses)).rejects.toThrow('RPC error');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch stakes')
        );
      });
    });

    describe('all', () => {
      it('should fetch all stake accounts', async () => {
        const mockStakes = StakeAccountFactory.createMany(5);

        // Mock getProgramAccounts to return properly structured response
        const mockResponse = mockStakes.map((stake) => ({
          pubkey: stake.address,
          account: {
            data: Buffer.from('mock-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: newAddr(999),
            rentEpoch: 0,
          },
        }));

        vi.spyOn(stakingClient, 'decodeStakeAccount').mockImplementation((account: any) => {
          // Find the matching mock stake by address
          const matchingStake = mockStakes.find((s) => s.address === account.address);
          return matchingStake || mockStakes[0];
        });

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockResponse),
        })) as any;

        const result = await stake.all();

        expect(result).toHaveLength(5);
        expect(result[0].amount).toBe(DEFAULT_STAKE_AMOUNT);
        expect(result[1].amount).toBe(DEFAULT_STAKE_AMOUNT * 2);
        expect(result[2].amount).toBe(DEFAULT_STAKE_AMOUNT * 3);
        expect(result[3].amount).toBe(DEFAULT_STAKE_AMOUNT * 4);
        expect(result[4].amount).toBe(DEFAULT_STAKE_AMOUNT * 5);
      });

      it('should handle empty results', async () => {
        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([]),
        })) as any;

        const result = await stake.all();

        expect(result).toHaveLength(0);
      });

      it('should filter out failed decodes', async () => {
        const mockStakes = StakeAccountFactory.createMany(3);

        const mockResponse = mockStakes.map((stake) => ({
          pubkey: stake.address,
          account: {
            data: Buffer.from('mock-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: newAddr(999),
            rentEpoch: 0,
          },
        }));

        let callCount = 0;
        vi.spyOn(stakingClient, 'decodeStakeAccount').mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Decode error');
          }
          return mockStakes[callCount - 1];
        });

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockResponse),
        })) as any;

        const result = await stake.all();

        // Should have 2 results (3 total - 1 failed decode)
        expect(result).toHaveLength(2);
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to decode stake')
        );
      });

      it('should handle RPC errors', async () => {
        const error = new Error('RPC connection failed');

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockRejectedValue(error),
        })) as any;

        await expect(stake.all()).rejects.toThrow('RPC connection failed');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch all stakes')
        );
      });
    });
  });

  describe('integration scenarios', () => {
    let sdk: ReturnType<typeof MockClientFactory.createMockWithRpc>['sdk'];
    let stake: StakeProgram;

    beforeEach(() => {
      const ctx = MockClientFactory.createMockWithRpc();
      sdk = ctx.sdk;
      stake = createStakeProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    it('should handle mixed stake amounts', async () => {
      const smallAmount = 100;
      const largeAmount = 10000;
      const tinyAmount = 50;
      const stakes = [
        StakeAccountFactory.createWithAmount(smallAmount),
        StakeAccountFactory.createWithAmount(largeAmount),
        StakeAccountFactory.createWithAmount(tinyAmount),
      ];

      vi.spyOn(stakingClient, 'fetchAllStakeAccount' as any).mockResolvedValue(stakes);

      const result = await stake.multiple(stakes.map((s) => s.address));

      expect(result[0].amount).toBe(smallAmount);
      expect(result[1].amount).toBe(largeAmount);
      expect(result[2].amount).toBe(tinyAmount);
    });

    it('should handle unstaking stakes', async () => {
      const unstakingStake = StakeAccountFactory.createUnstaking();

      vi.spyOn(stakingClient, 'fetchStakeAccount' as any).mockResolvedValue(unstakingStake);

      const result = await stake.get(unstakingStake.address);

      expect(result.timeUnstake).toBeGreaterThan(0);
      expect(result.address).toBe(unstakingStake.address);
    });

    it('should handle large amounts with xnos', async () => {
      const addr = newAddr(500);
      const largeStake = StakeAccountFactory.create({
        address: addr,
        amount: BigInt(1_000_000_000), // 1 billion
        xnos: BigInt(1_500_000_000), // 1.5 billion
      });

      vi.spyOn(stakingClient, 'fetchStakeAccount' as any).mockResolvedValue(largeStake);

      const transformed = await stake.get(addr);

      expect(transformed.amount).toBe(1_000_000_000);
      expect(transformed.xnos).toBe(1_500_000_000);
      expect(typeof transformed.amount).toBe('number');
      expect(typeof transformed.xnos).toBe('number');
    });
  });
});
