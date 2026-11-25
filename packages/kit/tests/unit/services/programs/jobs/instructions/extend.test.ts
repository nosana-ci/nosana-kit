import { describe, it, expect, afterEach, vi } from 'vitest';
import * as programClient from '@nosana/jobs-program';

import { extend } from '../../../../../../src/services/programs/jobs/instructions/extend.js';
import { createJobsProgram } from '../../../../../../src/services/programs/jobs/index.js';
import { AddressFactory, MockClientFactory, sdkToProgramDeps } from '../../../../setup/index.js';

const CURRENT_TIMEOUT = 100;
const EXTENSION = 30;

function helperParamsFor(matchDeployedLayout: (...args: never[]) => Promise<unknown>) {
  const sdk = MockClientFactory.createBasic();
  const deps = sdkToProgramDeps(sdk);
  const jobs = createJobsProgram(deps, sdk.config.programs);
  const wallet = { address: AddressFactory.create(130) };
  return {
    deps,
    config: sdk.config.programs,
    client: programClient,
    get: vi.fn(async () => ({ market: AddressFactory.create(131), timeout: CURRENT_TIMEOUT })),
    getRuns: jobs.runs.bind(jobs),
    getRequiredWallet: () => wallet,
    getStaticAccounts: async () => ({
      jobsProgram: sdk.config.programs.jobsAddress,
      rewardsProgram: sdk.config.programs.rewardsAddress,
      rewardsReflection: AddressFactory.create(132),
      rewardsVault: AddressFactory.create(133),
      feeVault: AddressFactory.create(134),
    }),
    getNosATA: sdk.nos.getATA.bind(sdk.nos),
    matchDeployedLayout,
  } as unknown as Parameters<typeof extend>[1];
}

describe('extend instruction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('extends the job by the given time on top of its current timeout', async () => {
    const extendSpy = vi.spyOn(programClient, 'getExtendInstruction');
    const job = AddressFactory.create(135);

    await extend(
      { job, timeout: EXTENSION },
      helperParamsFor(async (_name, instruction) => instruction)
    );

    const args = extendSpy.mock.calls[0][0];
    expect(args.job).toBe(job);
    expect(args.timeout).toBe(BigInt(CURRENT_TIMEOUT + EXTENSION));
  });

  it('returns the instruction in the deployed layout, matched with the NOS payer', async () => {
    const payer = { address: AddressFactory.create(136) };
    const deployed = { accounts: [] };
    const matchDeployedLayout = vi.fn(async () => deployed);
    vi.spyOn(programClient, 'getExtendInstruction');

    const instr = await extend(
      { job: AddressFactory.create(135), timeout: EXTENSION, payer: payer as never },
      helperParamsFor(matchDeployedLayout)
    );

    const built = vi.mocked(programClient.getExtendInstruction).mock.results[0].value;
    expect(matchDeployedLayout).toHaveBeenCalledWith('extend', built, payer.address);
    expect(instr).toBe(deployed);
  });
});
