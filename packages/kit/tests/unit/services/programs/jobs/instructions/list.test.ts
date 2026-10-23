import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';

import { list } from '../../../../../../src/services/programs/jobs/instructions/list.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

const IPFS_BYTES_LENGTH = 32;

describe('list instruction', () => {
  let helperParams: Parameters<typeof list>[1];
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];
  let jobs: ReturnType<typeof createJobsProgram>;

  beforeEach(() => {
    const sdk = MockClientFactory.createBasic();
    const deps = sdkToProgramDeps(sdk);
    config = sdk.config;
    jobs = createJobsProgram(deps, config.programs);

    helperParams = {
      deps,
      config: config.programs,
      client: programClient,
      get: jobs.get.bind(jobs),
      getRuns: jobs.runs.bind(jobs),
      getRequiredWallet: () => {
        const wallet = deps.getWallet();
        if (!wallet) {
          throw new Error('Wallet is required');
        }
        return wallet;
      },
      getStaticAccounts: async () => {
        const jobsProgram = config.programs.jobsAddress;
        const rewardsProgram = config.programs.rewardsAddress;
        return {
          jobsProgram,
          rewardsProgram,
          rewardsReflection: AddressFactory.create(999),
          rewardsVault: AddressFactory.create(998),
        };
      },
      getNosATA: sdk.nos.getATA.bind(sdk.nos),
    };
  });

  beforeEach(() => {
    vi.spyOn(programClient, 'fetchMaybeMarketSettingsAccount' as any).mockResolvedValue({
      exists: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates list instruction with ipfsHashToSolBytesArray and PDAs', async () => {
    const walletAddr = AddressFactory.create(70);
    const vaultPda = AddressFactory.create(80);
    const programAddr = AddressFactory.create(73);
    const marketAddr = AddressFactory.create(74);
    const timeout = 1000;
    const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
    const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);

    const listSpy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
      programAddress: programAddr,
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instr = await list({ market: marketAddr, timeout, ipfsHash: ipfsCid }, helperParams);

    // Assert - verify behavior: instruction is created with correct IPFS bytes using ipfsHashToSolBytesArray
    expect(listSpy).toHaveBeenCalled();
    const args = listSpy.mock.calls[0][0] as any;
    expect(Array.from(args.ipfsJob)).toEqual(ipfsBytes);
    expect(instr).toBeDefined();
  });

  describe('project access', () => {
    const walletAddr = AddressFactory.create(70);
    const pda = AddressFactory.create(81);
    const marketAddr = AddressFactory.create(74);
    const accessKey = AddressFactory.create(76);
    const ipfsCid = solBytesArrayToIpfsHash(Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i));
    let spy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      (helperParams.deps.getWallet as any) = () => ({ address: walletAddr });
      (helperParams.deps.solana.pda as any) = vi.fn(async () => pda);
      (helperParams.deps.solana.getNftFromCollection as any) = vi.fn(async () => undefined);
      spy = vi.spyOn(programClient, 'getListInstruction' as any).mockReturnValue({
        programAddress: AddressFactory.create(73),
        accounts: [],
        data: new Uint8Array([1]),
      });
    });

    it('passes the market settings PDA and no access key accounts on an open market', async () => {
      vi.spyOn(programClient, 'fetchMaybeMarketSettingsAccount' as any).mockResolvedValue({
        exists: false,
      });

      await list({ market: marketAddr, timeout: 1000, ipfsHash: ipfsCid }, helperParams);

      const args = spy.mock.calls[0][0] as any;
      expect(helperParams.deps.solana.pda).toHaveBeenCalledWith(
        ['settings', marketAddr],
        config.programs.jobsAddress
      );
      expect(args.marketSettings).toBe(pda);
      expect(args.projectNft).toBeUndefined();
      expect(args.projectMetadata).toBeUndefined();
      expect(helperParams.deps.solana.getNftFromCollection).not.toHaveBeenCalled();
    });

    it('looks up the wallet NFT of the access key collection on a protected market', async () => {
      const nft = AddressFactory.create(90);
      vi.spyOn(programClient, 'fetchMaybeMarketSettingsAccount' as any).mockResolvedValue({
        exists: true,
        data: { projectAccessKey: accessKey },
      });
      (helperParams.deps.solana.getNftFromCollection as any) = vi.fn(async () => nft);

      await list({ market: marketAddr, timeout: 1000, ipfsHash: ipfsCid }, helperParams);

      expect(helperParams.deps.solana.getNftFromCollection).toHaveBeenCalledWith(
        walletAddr,
        accessKey
      );
      const args = spy.mock.calls[0][0] as any;
      expect(args.marketSettings).toBe(pda);
      expect(args.projectNft).toBeDefined();
      expect(args.projectMetadata).toBeDefined();
    });

    it('throws when the wallet holds no NFT of a protected market', async () => {
      vi.spyOn(programClient, 'fetchMaybeMarketSettingsAccount' as any).mockResolvedValue({
        exists: true,
        data: { projectAccessKey: accessKey },
      });

      await expect(
        list({ market: marketAddr, timeout: 1000, ipfsHash: ipfsCid }, helperParams)
      ).rejects.toThrow('holds no access key NFT');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
