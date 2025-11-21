import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMerkleDistributorProgram,
  type MerkleDistributorProgram,
  ALLOWED_RECEIVE_ADDRESSES,
  ClaimTarget,
} from '../../../../src/services/programs/MerkleDistributorProgram.js';
import * as merkleDistributorClient from '../../../../src/generated_clients/merkle_distributor/index.js';
import { type Address, generateKeyPairSigner } from '@solana/kit';
import {
  AddressFactory,
  MockClientFactory,
  MerkleDistributorAccountFactory,
  ClaimStatusAccountFactory,
  sdkToProgramDeps,
} from '../../helpers/index.js';
import bs58 from 'bs58';

vi.mock('@solana-program/token', () => ({
  findAssociatedTokenPda: vi.fn(async () => ['ata']),
  TOKEN_PROGRAM_ADDRESS: 'TokenProg',
}));

// Test constants
const DEFAULT_BUMP = 255;
const DEFAULT_VERSION = 1;
const DEFAULT_MAX_TOTAL_CLAIM = 1000000;
const DEFAULT_MAX_NUM_NODES = 1000;
const DEFAULT_AMOUNT_CLAIMED = 0;
const DEFAULT_AMOUNT_FORGONE = 0;
const DEFAULT_NUM_NODES_CLAIMED = 0;
const DEFAULT_TIMESTAMP = 0;
const DEFAULT_LOCKED_AMOUNT = 5000;
const DEFAULT_UNLOCKED_AMOUNT = 10000;
const CUSTOM_MAX_TOTAL_CLAIM = 5000000;
const CUSTOM_MAX_NUM_NODES = 5000;
const CUSTOM_AMOUNT_CLAIMED = 1000000;
const CUSTOM_AMOUNT_FORGONE = 50000;
const CUSTOM_NUM_NODES_CLAIMED = 100;
const CUSTOM_START_TS = 1000000;
const CUSTOM_END_TS = 2000000;
const CUSTOM_CLAWBACK_START_TS = 1500000;
const CUSTOM_LOCKED_AMOUNT = 15000;
const CUSTOM_LOCKED_WITHDRAWN = 5000;
const CUSTOM_UNLOCKED_AMOUNT = 25000;
const CUSTOM_UNLOCKED_CLAIMED = 10000;

// Helper functions
const baseSdk = () => MockClientFactory.createBasic();
const newAddr = (seed?: number) => AddressFactory.create(seed);
const makeDistributor = (addr?: Address) =>
  MerkleDistributorAccountFactory.create({ address: addr });
const makeClaimStatus = (addr?: Address) => ClaimStatusAccountFactory.create({ address: addr });

describe('MerkleDistributorProgram', () => {
  describe('initialization', () => {
    it('should initialize with SDK', () => {
      const sdk = baseSdk();
      const deps = {
        logger: sdk.logger,
        solana: sdk.solana,
        getWallet: () => sdk.wallet,
      };
      const program = createMerkleDistributorProgram(deps, sdk.config.programs);

      // Assert - observable behavior: all required methods are available
      expect(program).toBeDefined();
      expect(typeof program.get).toBe('function');
      expect(typeof program.all).toBe('function');
      expect(typeof program.getClaimStatus).toBe('function');
      expect(typeof program.getClaimStatusPda).toBe('function');
      expect(typeof program.claim).toBe('function');
    });

    it('should use program ID from config when fetching all distributors', async () => {
      const sdk = baseSdk();
      const deps = {
        logger: sdk.logger,
        solana: sdk.solana,
        getWallet: () => sdk.wallet,
      };
      const program = createMerkleDistributorProgram(deps, sdk.config.programs);

      sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
        send: vi.fn().mockResolvedValue([]),
      })) as any;

      await program.all();

      // Assert - observable behavior: uses correct program ID
      expect(sdk.solana.rpc.getProgramAccounts).toHaveBeenCalledWith(
        sdk.config.programs.merkleDistributorAddress,
        expect.any(Object)
      );
    });
  });

  describe('transforms', () => {
    let program: MerkleDistributorProgram;

    beforeEach(() => {
      const sdk = baseSdk();
      program = createMerkleDistributorProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    it('get converts bigint to numbers and includes address', async () => {
      const addr = newAddr(100);
      const acc = makeDistributor(addr);

      vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(acc);

      const out = await program.get(addr);

      expect(out.address).toBe(acc.address);
      expect(out.bump).toBe(DEFAULT_BUMP);
      expect(out.version).toBe(DEFAULT_VERSION);
      expect(out.maxTotalClaim).toBe(DEFAULT_MAX_TOTAL_CLAIM);
      expect(out.maxNumNodes).toBe(DEFAULT_MAX_NUM_NODES);
      expect(out.totalAmountClaimed).toBe(DEFAULT_AMOUNT_CLAIMED);
      expect(out.totalAmountForgone).toBe(DEFAULT_AMOUNT_FORGONE);
      expect(out.numNodesClaimed).toBe(DEFAULT_NUM_NODES_CLAIMED);
      expect(out.startTs).toBe(DEFAULT_TIMESTAMP);
      expect(out.endTs).toBe(DEFAULT_TIMESTAMP);
      expect(out.clawbackStartTs).toBe(DEFAULT_TIMESTAMP);
      expect(out.clawedBack).toBe(false);
      expect(out.enableSlot).toBe(0);
      expect(out.closable).toBe(false);
      expect(typeof out.version).toBe('number');
      expect(typeof out.maxTotalClaim).toBe('number');
      expect(typeof out.maxNumNodes).toBe('number');
      expect(typeof out.totalAmountClaimed).toBe('number');
      expect(typeof out.totalAmountForgone).toBe('number');
      expect(typeof out.numNodesClaimed).toBe('number');
      expect(typeof out.startTs).toBe('number');
      expect(typeof out.endTs).toBe('number');
      expect(typeof out.clawbackStartTs).toBe('number');
      expect(typeof out.enableSlot).toBe('number');
    });

    it('get converts root and buffers to base58', async () => {
      const addr = newAddr(102);
      const rootBytes = new Uint8Array(32).fill(42);
      const bufferBytes = new Uint8Array(32).fill(99);
      const acc = MerkleDistributorAccountFactory.create({
        address: addr,
        root: rootBytes,
        buffer0: bufferBytes,
        buffer1: bufferBytes,
        buffer2: bufferBytes,
      });

      vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(acc);

      const out = await program.get(addr);

      expect(out.root).toBe(bs58.encode(Buffer.from(rootBytes)));
      expect(out.buffer0).toBe(bs58.encode(Buffer.from(bufferBytes)));
      expect(out.buffer1).toBe(bs58.encode(Buffer.from(bufferBytes)));
      expect(out.buffer2).toBe(bs58.encode(Buffer.from(bufferBytes)));
    });

    it('get handles all distributor account fields', async () => {
      const addr = newAddr(101);
      const customMint = newAddr(200);
      const customVault = newAddr(201);
      const customAdmin = newAddr(202);
      const customClawbackReceiver = newAddr(203);
      const acc = MerkleDistributorAccountFactory.create({
        address: addr,
        mint: customMint,
        tokenVault: customVault,
        admin: customAdmin,
        clawbackReceiver: customClawbackReceiver,
        version: BigInt(2),
        maxTotalClaim: BigInt(CUSTOM_MAX_TOTAL_CLAIM),
        maxNumNodes: BigInt(CUSTOM_MAX_NUM_NODES),
        totalAmountClaimed: BigInt(CUSTOM_AMOUNT_CLAIMED),
        totalAmountForgone: BigInt(CUSTOM_AMOUNT_FORGONE),
        numNodesClaimed: BigInt(CUSTOM_NUM_NODES_CLAIMED),
        startTs: BigInt(CUSTOM_START_TS),
        endTs: BigInt(CUSTOM_END_TS),
        clawbackStartTs: BigInt(CUSTOM_CLAWBACK_START_TS),
        clawedBack: true,
        enableSlot: BigInt(12345),
        closable: true,
        bump: 254,
      });

      vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(acc);

      const out = await program.get(addr);

      expect(out.address).toBe(acc.address);
      expect(out.mint).toBe(customMint);
      expect(out.tokenVault).toBe(customVault);
      expect(out.admin).toBe(customAdmin);
      expect(out.clawbackReceiver).toBe(customClawbackReceiver);
      expect(out.version).toBe(2);
      expect(out.maxTotalClaim).toBe(CUSTOM_MAX_TOTAL_CLAIM);
      expect(out.maxNumNodes).toBe(CUSTOM_MAX_NUM_NODES);
      expect(out.totalAmountClaimed).toBe(CUSTOM_AMOUNT_CLAIMED);
      expect(out.totalAmountForgone).toBe(CUSTOM_AMOUNT_FORGONE);
      expect(out.numNodesClaimed).toBe(CUSTOM_NUM_NODES_CLAIMED);
      expect(out.startTs).toBe(CUSTOM_START_TS);
      expect(out.endTs).toBe(CUSTOM_END_TS);
      expect(out.clawbackStartTs).toBe(CUSTOM_CLAWBACK_START_TS);
      expect(out.clawedBack).toBe(true);
      expect(out.enableSlot).toBe(12345);
      expect(out.closable).toBe(true);
      expect(out.bump).toBe(254);
    });

    it('getClaimStatus converts bigint to numbers and includes address', async () => {
      const addr = newAddr(300);
      const acc = makeClaimStatus(addr);

      vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
        exists: true,
        ...acc,
      });

      const out = await program.getClaimStatus(addr);

      expect(out.address).toBe(acc.address);
      expect(out.lockedAmount).toBe(DEFAULT_LOCKED_AMOUNT);
      expect(out.lockedAmountWithdrawn).toBe(DEFAULT_AMOUNT_CLAIMED);
      expect(out.unlockedAmount).toBe(DEFAULT_UNLOCKED_AMOUNT);
      expect(out.unlockedAmountClaimed).toBe(DEFAULT_AMOUNT_CLAIMED);
      expect(out.closable).toBe(false);
      expect(typeof out.lockedAmount).toBe('number');
      expect(typeof out.lockedAmountWithdrawn).toBe('number');
      expect(typeof out.unlockedAmount).toBe('number');
      expect(typeof out.unlockedAmountClaimed).toBe('number');
    });

    it('getClaimStatus handles all claim status account fields', async () => {
      const addr = newAddr(301);
      const customClaimant = newAddr(400);
      const customDistributor = newAddr(401);
      const acc = ClaimStatusAccountFactory.create({
        address: addr,
        claimant: customClaimant,
        distributor: customDistributor,
        lockedAmount: BigInt(CUSTOM_LOCKED_AMOUNT),
        lockedAmountWithdrawn: BigInt(CUSTOM_LOCKED_WITHDRAWN),
        unlockedAmount: BigInt(CUSTOM_UNLOCKED_AMOUNT),
        unlockedAmountClaimed: BigInt(CUSTOM_UNLOCKED_CLAIMED),
        closable: true,
      });

      vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
        exists: true,
        ...acc,
      });

      const out = await program.getClaimStatus(addr);

      expect(out.address).toBe(acc.address);
      expect(out.claimant).toBe(customClaimant);
      expect(out.distributor).toBe(customDistributor);
      expect(out.lockedAmount).toBe(CUSTOM_LOCKED_AMOUNT);
      expect(out.lockedAmountWithdrawn).toBe(CUSTOM_LOCKED_WITHDRAWN);
      expect(out.unlockedAmount).toBe(CUSTOM_UNLOCKED_AMOUNT);
      expect(out.unlockedAmountClaimed).toBe(CUSTOM_UNLOCKED_CLAIMED);
      expect(out.closable).toBe(true);
    });

  });

  describe('methods', () => {
    let sdk: ReturnType<typeof MockClientFactory.createMockWithRpc>['sdk'];
    let program: MerkleDistributorProgram;

    beforeEach(() => {
      const ctx = MockClientFactory.createMockWithRpc();
      sdk = ctx.sdk;
      program = createMerkleDistributorProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    describe('get', () => {
      it('should fetch and transform a single merkle distributor account', async () => {
        const addr = newAddr(500);
        const mockDistributor = makeDistributor(addr);

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(
          mockDistributor
        );

        const result = await program.get(addr);

        expect(result.address).toBe(addr);
        expect(result.maxTotalClaim).toBe(1000000);
        expect(result.maxNumNodes).toBe(1000);
        expect(merkleDistributorClient.fetchMerkleDistributor).toHaveBeenCalledWith(
          sdk.solana.rpc,
          addr
        );
      });

      it('should handle errors when fetching distributor', async () => {
        const addr = newAddr(501);
        const error = new Error('Account not found');

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockRejectedValue(error);

        await expect(program.get(addr)).rejects.toThrow('Account not found');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch merkle distributor')
        );
      });
    });

    describe('all', () => {
      it('should fetch all merkle distributor accounts', async () => {
        const mockDistributors = MerkleDistributorAccountFactory.createMany(5);

        // Mock getProgramAccounts to return properly structured response
        const mockResponse = mockDistributors.map((distributor) => ({
          pubkey: distributor.address,
          account: {
            data: Buffer.from('mock-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: newAddr(999),
            rentEpoch: 0,
          },
        }));

        vi.spyOn(merkleDistributorClient, 'decodeMerkleDistributor').mockImplementation(
          (account: any) => {
            // Find the matching mock distributor by address
            const matchingDistributor = mockDistributors.find((d) => d.address === account.address);
            return matchingDistributor || mockDistributors[0];
          }
        );

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockResponse),
        })) as any;

        const result = await program.all();

        expect(result).toHaveLength(5);
        expect(result[0].maxTotalClaim).toBe(1000000);
        expect(result[1].maxTotalClaim).toBe(2000000);
        expect(result[2].maxTotalClaim).toBe(3000000);
        expect(result[3].maxTotalClaim).toBe(4000000);
        expect(result[4].maxTotalClaim).toBe(5000000);
      });

      it('should handle empty results', async () => {
        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([]),
        })) as any;

        const result = await program.all();

        expect(result).toHaveLength(0);
      });

      it('should filter out failed decodes', async () => {
        const mockDistributors = MerkleDistributorAccountFactory.createMany(3);

        const mockResponse = mockDistributors.map((distributor) => ({
          pubkey: distributor.address,
          account: {
            data: Buffer.from('mock-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: newAddr(999),
            rentEpoch: 0,
          },
        }));

        let callCount = 0;
        vi.spyOn(merkleDistributorClient, 'decodeMerkleDistributor').mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Decode error');
          }
          return mockDistributors[callCount - 1];
        });

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockResponse),
        })) as any;

        const result = await program.all();

        // Should have 2 results (3 total - 1 failed decode)
        expect(result).toHaveLength(2);
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to decode merkle distributor')
        );
      });

      it('should handle RPC errors', async () => {
        const error = new Error('RPC connection failed');

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockRejectedValue(error),
        })) as any;

        await expect(program.all()).rejects.toThrow('RPC connection failed');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch all merkle distributors')
        );
      });
    });

    describe('getClaimStatus', () => {
      it('should fetch and transform a single claim status account', async () => {
        const addr = newAddr(600);
        const mockClaimStatus = makeClaimStatus(addr);

        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: true,
          ...mockClaimStatus,
        });

        const result = await program.getClaimStatus(addr);

        expect(result.address).toBe(addr);
        expect(result.unlockedAmount).toBe(10000);
        expect(result.lockedAmount).toBe(5000);
        expect(merkleDistributorClient.fetchMaybeClaimStatus).toHaveBeenCalledWith(
          sdk.solana.rpc,
          addr
        );
      });

      it('should throw error when claim status does not exist', async () => {
        const addr = newAddr(601);

        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: false,
        });

        await expect(program.getClaimStatus(addr)).rejects.toThrow('not found');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch claim status')
        );
      });

      it('should handle errors when fetching claim status', async () => {
        const addr = newAddr(602);
        const error = new Error('RPC connection failed');

        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockRejectedValue(error);

        await expect(program.getClaimStatus(addr)).rejects.toThrow('RPC connection failed');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch claim status')
        );
      });
    });

    describe('getClaimStatusPda', () => {
      let walletSdk: ReturnType<typeof MockClientFactory.createMockWithWallet>;
      let walletProgram: MerkleDistributorProgram;

      beforeEach(() => {
        walletSdk = MockClientFactory.createMockWithWallet();
        walletSdk.solana = {
          rpc: {} as any,
          pda: vi.fn().mockResolvedValue(newAddr(700)),
        } as any;
        walletProgram = createMerkleDistributorProgram(
          sdkToProgramDeps(walletSdk),
          walletSdk.config.programs
        );
      });

      it('should derive claim status PDA using wallet address when claimant is not provided', async () => {
        const distributorAddr = newAddr(760);
        const claimStatusPda = newAddr(761);

        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);

        const result = await walletProgram.getClaimStatusPda(distributorAddr);

        expect(result).toBe(claimStatusPda);
        expect(walletSdk.solana.pda).toHaveBeenCalledWith(
          ['ClaimStatus', walletSdk.wallet!.address, distributorAddr],
          walletSdk.config.programs.merkleDistributorAddress
        );
      });

      it('should derive claim status PDA using provided claimant address', async () => {
        const distributorAddr = newAddr(762);
        const claimantAddr = newAddr(763);
        const claimStatusPda = newAddr(764);

        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);

        const result = await walletProgram.getClaimStatusPda(distributorAddr, claimantAddr);

        expect(result).toBe(claimStatusPda);
        expect(walletSdk.solana.pda).toHaveBeenCalledWith(
          ['ClaimStatus', claimantAddr, distributorAddr],
          walletSdk.config.programs.merkleDistributorAddress
        );
      });

      it('should throw error when signer is not set and claimant is not provided', async () => {
        const sdkWithoutWallet = MockClientFactory.createBasic();
        sdkWithoutWallet.solana = {
          rpc: {} as any,
          pda: vi.fn(),
        } as any;
        const programWithoutWallet = createMerkleDistributorProgram(
          sdkToProgramDeps(sdkWithoutWallet),
          sdkWithoutWallet.config.programs
        );

        await expect(programWithoutWallet.getClaimStatusPda(newAddr(765))).rejects.toThrow(
          'Wallet not set'
        );
      });

      it('should work without wallet when claimant is provided', async () => {
        const sdkWithoutWallet = MockClientFactory.createBasic();
        const distributorAddr = newAddr(766);
        const claimantAddr = newAddr(767);
        const claimStatusPda = newAddr(768);

        sdkWithoutWallet.solana = {
          rpc: {} as any,
          pda: vi.fn().mockResolvedValue(claimStatusPda),
        } as any;
        const programWithoutWallet = createMerkleDistributorProgram(
          sdkToProgramDeps(sdkWithoutWallet),
          sdkWithoutWallet.config.programs
        );

        const result = await programWithoutWallet.getClaimStatusPda(distributorAddr, claimantAddr);

        expect(result).toBe(claimStatusPda);
        expect(sdkWithoutWallet.solana.pda).toHaveBeenCalledWith(
          ['ClaimStatus', claimantAddr, distributorAddr],
          sdkWithoutWallet.config.programs.merkleDistributorAddress
        );
      });
    });

    describe('getClaimStatusForDistributor', () => {
      let walletSdk: ReturnType<typeof MockClientFactory.createMockWithWallet>;
      let walletProgram: MerkleDistributorProgram;

      beforeEach(() => {
        walletSdk = MockClientFactory.createMockWithWallet();
        walletSdk.solana = {
          rpc: {} as any,
          pda: vi.fn().mockResolvedValue(newAddr(700)),
        } as any;
        walletProgram = createMerkleDistributorProgram(
          sdkToProgramDeps(walletSdk),
          walletSdk.config.programs
        );
      });

      it('should fetch and return claim status when it exists', async () => {
        const distributorAddr = newAddr(750);
        const claimStatusPda = newAddr(751);
        const mockClaimStatus = ClaimStatusAccountFactory.create({
          address: claimStatusPda,
          claimant: walletSdk.wallet!.address,
          distributor: distributorAddr,
        });

        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: true,
          ...mockClaimStatus,
        });

        const result = await walletProgram.getClaimStatusForDistributor(distributorAddr);

        expect(result).not.toBeNull();
        expect(result!.address).toBe(claimStatusPda);
        expect(result!.claimant).toBe(walletSdk.wallet!.address);
        expect(result!.distributor).toBe(distributorAddr);
        expect(result!.unlockedAmount).toBe(10000);
        expect(result!.lockedAmount).toBe(5000);
        expect(merkleDistributorClient.fetchMaybeClaimStatus).toHaveBeenCalledWith(
          walletSdk.solana.rpc,
          claimStatusPda
        );
      });

      it('should return null when claim status does not exist', async () => {
        const distributorAddr = newAddr(752);
        const claimStatusPda = newAddr(753);

        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: false,
        });

        const result = await walletProgram.getClaimStatusForDistributor(distributorAddr);

        expect(result).toBeNull();
      });

      it('should throw error when signer is not set', async () => {
        const sdkWithoutWallet = MockClientFactory.createBasic();
        sdkWithoutWallet.solana = {
          rpc: {} as any,
          pda: vi.fn(),
        } as any;
        const programWithoutWallet = createMerkleDistributorProgram(
          sdkToProgramDeps(sdkWithoutWallet),
          sdkWithoutWallet.config.programs
        );

        await expect(
          programWithoutWallet.getClaimStatusForDistributor(newAddr(754))
        ).rejects.toThrow('Wallet not set');
      });

      it('should handle errors when fetching claim status', async () => {
        const distributorAddr = newAddr(755);
        const claimStatusPda = newAddr(756);
        const error = new Error('RPC connection failed');

        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockRejectedValue(error);

        await expect(walletProgram.getClaimStatusForDistributor(distributorAddr)).rejects.toThrow(
          'RPC connection failed'
        );
        expect(walletSdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch claim status')
        );
      });

      it('should fetch claim status for a provided claimant address', async () => {
        const distributorAddr = newAddr(757);
        const claimantAddr = newAddr(758);
        const claimStatusPda = newAddr(759);
        const mockClaimStatus = ClaimStatusAccountFactory.create({
          address: claimStatusPda,
          claimant: claimantAddr,
          distributor: distributorAddr,
        });

        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: true,
          ...mockClaimStatus,
        });

        const result = await walletProgram.getClaimStatusForDistributor(
          distributorAddr,
          claimantAddr
        );

        expect(result).not.toBeNull();
        expect(result!.address).toBe(claimStatusPda);
        expect(result!.claimant).toBe(claimantAddr);
        expect(result!.distributor).toBe(distributorAddr);
        expect(walletSdk.solana.pda).toHaveBeenCalledWith(
          ['ClaimStatus', claimantAddr, distributorAddr],
          walletSdk.config.programs.merkleDistributorAddress
        );
      });

      it('should work without wallet when claimant is provided', async () => {
        const sdkWithoutWallet = MockClientFactory.createBasic();
        const distributorAddr = newAddr(760);
        const claimantAddr = newAddr(761);
        const claimStatusPda = newAddr(762);
        const mockClaimStatus = ClaimStatusAccountFactory.create({
          address: claimStatusPda,
          claimant: claimantAddr,
          distributor: distributorAddr,
        });

        sdkWithoutWallet.solana = {
          rpc: {} as any,
          pda: vi.fn().mockResolvedValue(claimStatusPda),
        } as any;
        const programWithoutWallet = createMerkleDistributorProgram(
          sdkToProgramDeps(sdkWithoutWallet),
          sdkWithoutWallet.config.programs
        );

        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: true,
          ...mockClaimStatus,
        });

        const result = await programWithoutWallet.getClaimStatusForDistributor(
          distributorAddr,
          claimantAddr
        );

        expect(result).not.toBeNull();
        expect(result!.claimant).toBe(claimantAddr);
      });
    });

    describe('allClaimStatus', () => {
      it('should fetch all claim status accounts', async () => {
        const mockClaimStatuses = ClaimStatusAccountFactory.createMany(5);

        // Mock getProgramAccounts to return properly structured response
        const mockResponse = mockClaimStatuses.map((claimStatus) => ({
          pubkey: claimStatus.address,
          account: {
            data: Buffer.from('mock-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: newAddr(999),
            rentEpoch: 0,
          },
        }));

        vi.spyOn(merkleDistributorClient, 'decodeClaimStatus').mockImplementation(
          (account: any) => {
            // Find the matching mock claim status by address
            const matchingClaimStatus = mockClaimStatuses.find(
              (c) => c.address === account.address
            );
            return matchingClaimStatus || mockClaimStatuses[0];
          }
        );

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockResponse),
        })) as any;

        const result = await program.allClaimStatus();

        expect(result).toHaveLength(5);
        expect(result[0].unlockedAmount).toBe(10000);
        expect(result[1].unlockedAmount).toBe(20000);
        expect(result[2].unlockedAmount).toBe(30000);
        expect(result[3].unlockedAmount).toBe(40000);
        expect(result[4].unlockedAmount).toBe(50000);
      });

      it('should handle empty results', async () => {
        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue([]),
        })) as any;

        const result = await program.allClaimStatus();

        expect(result).toHaveLength(0);
      });

      it('should filter out failed decodes', async () => {
        const mockClaimStatuses = ClaimStatusAccountFactory.createMany(3);

        const mockResponse = mockClaimStatuses.map((claimStatus) => ({
          pubkey: claimStatus.address,
          account: {
            data: Buffer.from('mock-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: newAddr(999),
            rentEpoch: 0,
          },
        }));

        let callCount = 0;
        vi.spyOn(merkleDistributorClient, 'decodeClaimStatus').mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Decode error');
          }
          return mockClaimStatuses[callCount - 1];
        });

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockResolvedValue(mockResponse),
        })) as any;

        const result = await program.allClaimStatus();

        // Should have 2 results (3 total - 1 failed decode)
        expect(result).toHaveLength(2);
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to decode claim status')
        );
      });

      it('should handle RPC errors', async () => {
        const error = new Error('RPC connection failed');

        sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
          send: vi.fn().mockRejectedValue(error),
        })) as any;

        await expect(program.allClaimStatus()).rejects.toThrow('RPC connection failed');
        expect(sdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to fetch all claim statuses')
        );
      });
    });

    describe('claim', () => {
      let walletSdk: ReturnType<typeof MockClientFactory.createMockWithWallet>['sdk'];
      let walletProgram: MerkleDistributorProgram;

      beforeEach(() => {
        walletSdk = MockClientFactory.createMockWithWallet();
        walletSdk.solana = {
          rpc: {} as any,
          pda: vi.fn().mockResolvedValue(newAddr(700)),
        } as any;
        walletProgram = createMerkleDistributorProgram(
          sdkToProgramDeps(walletSdk),
          walletSdk.config.programs
        );
      });

      it('should create a newClaim instruction with correct parameters (YES target)', async () => {
        const distributorAddr = newAddr(800);
        const distributorAccount = MerkleDistributorAccountFactory.create({
          address: distributorAddr,
          mint: newAddr(801),
          tokenVault: newAddr(802),
        });
        const claimStatusPda = newAddr(803);
        const targetAta = newAddr(804); // ATA of YES address
        const proof = [new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)];

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(
          distributorAccount
        );
        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: false,
        });
        const token = await import('@solana-program/token');
        // Mock findAssociatedTokenPda to return the ATA of the YES address
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([targetAta]);

        const mockInstruction = {
          accounts: [],
          data: Buffer.from('test'),
        };
        vi.spyOn(merkleDistributorClient, 'getNewClaimInstruction' as any).mockReturnValue(
          mockInstruction
        );

        const result = await walletProgram.claim({
          distributor: distributorAddr,
          amountUnlocked: 10000,
          amountLocked: 5000,
          proof,
          target: ClaimTarget.YES,
        });

        expect(result).toBe(mockInstruction);
        expect(merkleDistributorClient.fetchMerkleDistributor).toHaveBeenCalledWith(
          walletSdk.solana.rpc,
          distributorAddr
        );
        expect(walletSdk.solana.pda).toHaveBeenCalledWith(
          ['ClaimStatus', walletSdk.wallet!.address, distributorAddr],
          walletSdk.config.programs.merkleDistributorAddress
        );
        // Verify findAssociatedTokenPda was called with the YES address, not the claimant's address
        expect(token.findAssociatedTokenPda).toHaveBeenCalledWith({
          mint: distributorAccount.data.mint,
          owner: ALLOWED_RECEIVE_ADDRESSES[ClaimTarget.YES],
          tokenProgram: 'TokenProg',
        });
        expect(merkleDistributorClient.getNewClaimInstruction).toHaveBeenCalledWith(
          expect.objectContaining({
            distributor: distributorAddr,
            claimStatus: claimStatusPda,
            from: distributorAccount.data.tokenVault,
            to: targetAta, // Should be ATA of YES address, not claimant's ATA
            claimant: walletSdk.wallet,
            amountUnlocked: 10000,
            amountLocked: 5000,
            proof,
          }),
          expect.objectContaining({
            programAddress: walletSdk.config.programs.merkleDistributorAddress,
          })
        );
      });

      it('should throw error when signer is not set', async () => {
        const sdkWithoutWallet = MockClientFactory.createBasic();
        sdkWithoutWallet.solana = {
          rpc: {} as any,
          pda: vi.fn(),
        } as any;
        const programWithoutWallet = createMerkleDistributorProgram(
          sdkToProgramDeps(sdkWithoutWallet),
          sdkWithoutWallet.config.programs
        );

        await expect(
          programWithoutWallet.claim({
            distributor: newAddr(900),
            amountUnlocked: 10000,
            amountLocked: 5000,
            proof: [],
            target: ClaimTarget.YES,
          })
        ).rejects.toThrow('Wallet not set');
      });

      it('should throw error when tokens have already been claimed', async () => {
        const distributorAddr = newAddr(901);
        const distributorAccount = MerkleDistributorAccountFactory.create({
          address: distributorAddr,
        });
        const claimStatusPda = newAddr(902);

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(
          distributorAccount
        );
        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: true,
        });

        await expect(
          walletProgram.claim({
            distributor: distributorAddr,
            amountUnlocked: 10000,
            amountLocked: 5000,
            proof: [],
            target: ClaimTarget.YES,
          })
        ).rejects.toThrow('Tokens have already been claimed');
      });

      it('should create a newClaim instruction with NO target', async () => {
        const distributorAddr = newAddr(950);
        const distributorAccount = MerkleDistributorAccountFactory.create({
          address: distributorAddr,
          mint: newAddr(951),
          tokenVault: newAddr(952),
        });
        const claimStatusPda = newAddr(953);
        const targetAta = newAddr(954); // ATA of NO address
        const proof = [new Uint8Array(32).fill(3)];

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(
          distributorAccount
        );
        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: false,
        });
        const token = await import('@solana-program/token');
        // Mock findAssociatedTokenPda to return the ATA of the NO address
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([targetAta]);

        const mockInstruction = {
          accounts: [],
          data: Buffer.from('test'),
        };
        vi.spyOn(merkleDistributorClient, 'getNewClaimInstruction' as any).mockReturnValue(
          mockInstruction
        );

        const result = await walletProgram.claim({
          distributor: distributorAddr,
          amountUnlocked: 20000,
          amountLocked: 10000,
          proof,
          target: ClaimTarget.NO,
        });

        expect(result).toBe(mockInstruction);
        // Verify findAssociatedTokenPda was called with the NO address
        expect(token.findAssociatedTokenPda).toHaveBeenCalledWith({
          mint: distributorAccount.data.mint,
          owner: ALLOWED_RECEIVE_ADDRESSES[ClaimTarget.NO],
          tokenProgram: 'TokenProg',
        });
        expect(merkleDistributorClient.getNewClaimInstruction).toHaveBeenCalledWith(
          expect.objectContaining({
            to: targetAta, // Should be ATA of NO address
          }),
          expect.any(Object)
        );
      });

      it('should handle errors when creating claim instruction', async () => {
        const distributorAddr = newAddr(909);
        const error = new Error('RPC error');

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockRejectedValue(error);

        await expect(
          walletProgram.claim({
            distributor: distributorAddr,
            amountUnlocked: 10000,
            amountLocked: 5000,
            proof: [],
            target: ClaimTarget.YES,
          })
        ).rejects.toThrow('RPC error');
        expect(walletSdk.logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to create claim instructions')
        );
      });

      it('should accept bigint amounts', async () => {
        const distributorAddr = newAddr(910);
        const distributorAccount = MerkleDistributorAccountFactory.create({
          address: distributorAddr,
          mint: newAddr(911),
          tokenVault: newAddr(912),
        });
        const claimStatusPda = newAddr(913);
        const claimantAta = newAddr(914);

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(
          distributorAccount
        );
        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: false,
        });
        const token = await import('@solana-program/token');
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([claimantAta]);

        const mockInstruction = {
          accounts: [],
          data: Buffer.from('test'),
        };
        vi.spyOn(merkleDistributorClient, 'getNewClaimInstruction' as any).mockReturnValue(
          mockInstruction
        );

        await walletProgram.claim({
          distributor: distributorAddr,
          amountUnlocked: BigInt(30000),
          amountLocked: BigInt(15000),
          proof: [],
          target: ClaimTarget.YES,
        });

        expect(merkleDistributorClient.getNewClaimInstruction).toHaveBeenCalledWith(
          expect.objectContaining({
            amountUnlocked: BigInt(30000),
            amountLocked: BigInt(15000),
          }),
          expect.any(Object)
        );
      });

      it('should use provided claimant signer instead of wallet', async () => {
        const distributorAddr = newAddr(920);
        const distributorAccount = MerkleDistributorAccountFactory.create({
          address: distributorAddr,
          mint: newAddr(921),
          tokenVault: newAddr(922),
        });
        const claimStatusPda = newAddr(923);
        const targetAta = newAddr(924);
        const proof = [new Uint8Array(32).fill(4)];

        // Create a separate claimant signer (different from wallet)
        const claimantSigner = await generateKeyPairSigner();

        vi.spyOn(merkleDistributorClient, 'fetchMerkleDistributor' as any).mockResolvedValue(
          distributorAccount
        );
        // Mock PDA to return different address when called with claimant's address
        vi.spyOn(walletSdk.solana, 'pda').mockResolvedValue(claimStatusPda);
        vi.spyOn(merkleDistributorClient, 'fetchMaybeClaimStatus' as any).mockResolvedValue({
          exists: false,
        });
        const token = await import('@solana-program/token');
        vi.spyOn(token, 'findAssociatedTokenPda' as any).mockResolvedValue([targetAta]);

        const mockInstruction = {
          accounts: [],
          data: Buffer.from('test'),
        };
        vi.spyOn(merkleDistributorClient, 'getNewClaimInstruction' as any).mockReturnValue(
          mockInstruction
        );

        const result = await walletProgram.claim({
          distributor: distributorAddr,
          amountUnlocked: 15000,
          amountLocked: 7500,
          proof,
          target: ClaimTarget.NO,
          claimant: claimantSigner,
        });

        expect(result).toBe(mockInstruction);
        // Verify PDA was derived using claimant's address, not wallet's address
        expect(walletSdk.solana.pda).toHaveBeenCalledWith(
          ['ClaimStatus', claimantSigner.address, distributorAddr],
          walletSdk.config.programs.merkleDistributorAddress
        );
        // Verify instruction uses the claimant signer
        expect(merkleDistributorClient.getNewClaimInstruction).toHaveBeenCalledWith(
          expect.objectContaining({
            claimant: claimantSigner,
          }),
          expect.any(Object)
        );
      });

      it('should throw error when signer is not set and claimant is not provided', async () => {
        const sdkWithoutWallet = MockClientFactory.createBasic();
        sdkWithoutWallet.solana = {
          rpc: {} as any,
          pda: vi.fn(),
        } as any;
        const programWithoutWallet = createMerkleDistributorProgram(
          sdkToProgramDeps(sdkWithoutWallet),
          sdkWithoutWallet.config.programs
        );

        await expect(
          programWithoutWallet.claim({
            distributor: newAddr(925),
            amountUnlocked: 10000,
            amountLocked: 5000,
            proof: [],
            target: ClaimTarget.YES,
          })
        ).rejects.toThrow('Wallet not set');
      });
    });
  });

  describe('integration scenarios', () => {
    let sdk: ReturnType<typeof MockClientFactory.createMockWithRpc>['sdk'];
    let program: MerkleDistributorProgram;

    beforeEach(() => {
      const ctx = MockClientFactory.createMockWithRpc();
      sdk = ctx.sdk;
      program = createMerkleDistributorProgram(sdkToProgramDeps(sdk), sdk.config.programs);
    });

    it('should handle multiple distributors with different configurations', async () => {
      const distributors = [
        MerkleDistributorAccountFactory.create({
          maxTotalClaim: BigInt(1000000),
          totalAmountClaimed: BigInt(500000),
        }),
        MerkleDistributorAccountFactory.create({
          maxTotalClaim: BigInt(5000000),
          totalAmountClaimed: BigInt(2000000),
          clawedBack: true,
        }),
        MerkleDistributorAccountFactory.create({
          maxTotalClaim: BigInt(10000000),
          totalAmountClaimed: BigInt(0),
          numNodesClaimed: BigInt(0),
        }),
      ];

      const mockResponse = distributors.map((distributor) => ({
        pubkey: distributor.address,
        account: {
          data: Buffer.from('mock-data').toString('base64'),
          executable: false,
          lamports: 1000000,
          owner: newAddr(999),
          rentEpoch: 0,
        },
      }));

      vi.spyOn(merkleDistributorClient, 'decodeMerkleDistributor').mockImplementation(
        (account: any) => {
          const matchingDistributor = distributors.find((d) => d.address === account.address);
          return matchingDistributor || distributors[0];
        }
      );

      sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
        send: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await program.all();

      expect(result).toHaveLength(3);
      expect(result[0].totalAmountClaimed).toBe(500000);
      expect(result[1].totalAmountClaimed).toBe(2000000);
      expect(result[1].clawedBack).toBe(true);
      expect(result[2].totalAmountClaimed).toBe(0);
      expect(result[2].numNodesClaimed).toBe(0);
    });

    it('should handle claim statuses with various withdrawal states', async () => {
      const claimStatuses = [
        ClaimStatusAccountFactory.createWithAmounts(10000, 5000, {
          unlockedAmountClaimed: BigInt(0),
          lockedAmountWithdrawn: BigInt(0),
        }),
        ClaimStatusAccountFactory.createWithAmounts(20000, 10000, {
          unlockedAmountClaimed: BigInt(20000),
          lockedAmountWithdrawn: BigInt(0),
        }),
        ClaimStatusAccountFactory.createWithAmounts(30000, 15000, {
          unlockedAmountClaimed: BigInt(30000),
          lockedAmountWithdrawn: BigInt(15000),
        }),
      ];

      const mockResponse = claimStatuses.map((claimStatus) => ({
        pubkey: claimStatus.address,
        account: {
          data: Buffer.from('mock-data').toString('base64'),
          executable: false,
          lamports: 1000000,
          owner: newAddr(999),
          rentEpoch: 0,
        },
      }));

      vi.spyOn(merkleDistributorClient, 'decodeClaimStatus').mockImplementation((account: any) => {
        const matchingClaimStatus = claimStatuses.find((c) => c.address === account.address);
        return matchingClaimStatus || claimStatuses[0];
      });

      sdk.solana.rpc.getProgramAccounts = vi.fn(() => ({
        send: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await program.allClaimStatus();

      expect(result).toHaveLength(3);
      expect(result[0].unlockedAmountClaimed).toBe(0);
      expect(result[0].lockedAmountWithdrawn).toBe(0);
      expect(result[1].unlockedAmountClaimed).toBe(20000);
      expect(result[1].lockedAmountWithdrawn).toBe(0);
      expect(result[2].unlockedAmountClaimed).toBe(30000);
      expect(result[2].lockedAmountWithdrawn).toBe(15000);
    });
  });
});
