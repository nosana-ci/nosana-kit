import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { setMarketSettings } from '../../../../../../src/services/programs/jobs/instructions/setSettings.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

describe('setMarketSettings instruction', () => {
  let helperParams: Parameters<typeof setMarketSettings>[1];
  let config: ReturnType<typeof MockClientFactory.createBasic>['config'];

  beforeEach(() => {
    const sdk = MockClientFactory.createBasic();
    const deps = sdkToProgramDeps(sdk);
    config = sdk.config;
    const jobs = createJobsProgram(deps, config.programs);

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
      getStaticAccounts: async () => ({
        jobsProgram: config.programs.jobsAddress,
        rewardsProgram: config.programs.rewardsAddress,
        rewardsReflection: AddressFactory.create(999),
        rewardsVault: AddressFactory.create(998),
      }),
      getNosATA: sdk.nos.getATA.bind(sdk.nos),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the set settings instruction with the market settings PDA', async () => {
    const walletAddr = AddressFactory.create(60);
    const settingsPda = AddressFactory.create(61);
    const marketAddr = AddressFactory.create(62);
    const accessKey = AddressFactory.create(63);
    const wallet = { address: walletAddr } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => settingsPda);
    const spy = vi.spyOn(programClient, 'getSetSettingsInstruction' as any).mockReturnValue({
      programAddress: config.programs.jobsAddress,
      accounts: [],
      data: new Uint8Array([1]),
    });

    const instr = await setMarketSettings(
      { market: marketAddr, projectAccessKey: accessKey },
      helperParams
    );

    expect(instr).toBeDefined();
    expect(helperParams.deps.solana.pda).toHaveBeenCalledWith(
      ['settings', marketAddr],
      config.programs.jobsAddress
    );
    const [args, options] = spy.mock.calls[0] as any[];
    expect(args.market).toBe(marketAddr);
    expect(args.marketSettings).toBe(settingsPda);
    expect(args.projectAccessKey).toBe(accessKey);
    expect(args.authority).toBe(wallet);
    expect(options.programAddress).toBe(config.programs.jobsAddress);
  });

  it('throws when no wallet is set', async () => {
    (helperParams.deps.getWallet as any) = () => undefined;

    await expect(
      setMarketSettings(
        { market: AddressFactory.create(62), projectAccessKey: AddressFactory.create(63) },
        helperParams
      )
    ).rejects.toThrow('Failed to create set settings instruction');
  });
});
