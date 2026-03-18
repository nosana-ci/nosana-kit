import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { stop } from '../../../../../../src/services/programs/jobs/instructions/stop.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

describe('stop instruction', () => {
  let helperParams: Parameters<typeof stop>[1];
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates stop instruction with market and node (defaults to wallet)', async () => {
    const walletAddr = AddressFactory.create(260);
    const marketAddr = AddressFactory.create(261);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const stopSpy = vi.spyOn(programClient, 'getStopInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(262),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act - without node (should default to wallet)
    const instruction = await stop({ market: marketAddr }, helperParams);

    // Assert - verify behavior
    expect(stopSpy).toHaveBeenCalled();
    const args = stopSpy.mock.calls[0][0] as any;
    expect(args.market).toBe(marketAddr);
    expect(args.node).toBe(walletAddr);
    expect(args.authority).toBe(wallet);
    expect(instruction).toBeDefined();
  });

  it('creates stop instruction with market and provided node', async () => {
    const walletAddr = AddressFactory.create(270);
    const marketAddr = AddressFactory.create(271);
    const nodeAddr = AddressFactory.create(272);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const stopSpy = vi.spyOn(programClient, 'getStopInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(273),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act - with node provided
    const instruction = await stop({ market: marketAddr, node: nodeAddr }, helperParams);

    // Assert - verify behavior
    expect(stopSpy).toHaveBeenCalled();
    const args = stopSpy.mock.calls[0][0] as any;
    expect(args.market).toBe(marketAddr);
    expect(args.node).toBe(nodeAddr);
    expect(args.authority).toBe(wallet);
    expect(instruction).toBeDefined();
  });
});
