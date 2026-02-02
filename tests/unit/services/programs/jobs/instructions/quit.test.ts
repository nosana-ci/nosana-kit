import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { quit } from '../../../../../../src/services/programs/jobs/instructions/quit.js';
import * as programClient from '../../../../../../src/generated_clients/jobs/index.js';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import {
  AddressFactory,
  MockClientFactory,
  RunAccountFactory,
  sdkToProgramDeps,
} from '../../../../setup/index.js';

const RUN_TIME_555 = 555;

describe('quit instruction', () => {
  let helperParams: Parameters<typeof quit>[1];
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

  it('creates quit instruction with correct accounts from run', async () => {
    const walletAddr = AddressFactory.create(250);
    const runAddr = AddressFactory.create(251);
    const jobAddr = AddressFactory.create(252);
    const payerAddr = AddressFactory.create(253);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;

    const runAccount = RunAccountFactory.create({
      address: runAddr,
      job: jobAddr,
      payer: payerAddr,
      time: BigInt(RUN_TIME_555),
    });
    vi.spyOn(programClient, 'fetchRunAccount' as any).mockResolvedValue(runAccount);

    const quitSpy = vi.spyOn(programClient, 'getQuitInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(254),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instruction = await quit({ run: runAddr }, helperParams);

    // Assert - verify behavior
    expect(quitSpy).toHaveBeenCalled();
    const args = quitSpy.mock.calls[0][0] as any;
    expect(args.job).toBe(jobAddr);
    expect(args.run).toBe(runAddr);
    expect(args.payer).toBe(payerAddr);
    expect(args.authority).toBe(wallet);
    expect(instruction).toBeDefined();
  });
});
