import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { solBytesArrayToIpfsHash } from '@nosana/ipfs';

import { finish } from '../../../../../../src/services/programs/jobs/instructions/finish.js';
import * as programClient from '@nosana/jobs-program';
import { createJobsProgram, JobState } from '../../../../../../src/services/programs/jobs/index.js';
import {
  AddressFactory,
  JobAccountFactory,
  MockClientFactory,
  RunAccountFactory,
  sdkToProgramDeps,
} from '../../../../../setup/index.js';

const IPFS_BYTES_LENGTH = 32;
const RUN_TIME_555 = 555;

describe('finish instruction', () => {
  let helperParams: Parameters<typeof finish>[1];
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

  it('creates finish instruction with decoded ipfsResult and returns tuple', async () => {
    const walletAddr = AddressFactory.create(220);
    const jobAddr = AddressFactory.create(221);
    const nodeAddr = AddressFactory.create(223);
    const payerAddr = AddressFactory.create(224);
    const marketAddr = AddressFactory.create(225);
    const vaultPda = AddressFactory.create(226);
    const ipfsBytes = Array.from({ length: IPFS_BYTES_LENGTH }, (_, i) => i);
    const ipfsCid = solBytesArrayToIpfsHash(ipfsBytes);

    const wallet = {
      address: walletAddr,
      signMessages: async () => [],
      signTransactions: async () => [],
    } as any;
    (helperParams.deps.getWallet as any) = () => wallet;
    (helperParams.deps.solana.pda as any) = vi.fn(async () => vaultPda);
    (helperParams.deps.solana.getCreateATAInstructionIfNeeded as any) = vi.fn(async () => null);

    const jobAccount = JobAccountFactory.create({
      address: jobAddr,
      state: JobState.RUNNING,
    });
    jobAccount.data.market = marketAddr;
    jobAccount.data.payer = payerAddr;
    jobAccount.data.price = BigInt(100);
    vi.spyOn(programClient, 'fetchJobAccount' as any).mockResolvedValue(jobAccount);

    const runAccount = RunAccountFactory.create({
      job: jobAddr,
      time: BigInt(RUN_TIME_555),
      node: nodeAddr,
    });
    runAccount.data.payer = payerAddr;
    vi.spyOn(programClient, 'decodeRunAccount' as any).mockReturnValue(runAccount);
    (helperParams.deps.solana.rpc.getProgramAccounts as any) = vi.fn(() => ({
      send: vi.fn().mockResolvedValue([
        {
          pubkey: runAccount.address,
          account: {
            data: Buffer.from('mock-run-data').toString('base64'),
            executable: false,
            lamports: 1000000,
            owner: config.programs.jobsAddress,
            rentEpoch: 0,
          },
        },
      ]),
    }));

    const finishSpy = vi.spyOn(programClient, 'getFinishInstruction' as any).mockReturnValue({
      programAddress: AddressFactory.create(229),
      accounts: [],
      data: new Uint8Array([1]),
    });

    // Act
    const instructions = await finish({ job: jobAddr, ipfsResultsHash: ipfsCid }, helperParams);

    // Assert - verify behavior
    expect(finishSpy).toHaveBeenCalled();
    const args = finishSpy.mock.calls[0][0] as any;
    expect(Array.from(args.ipfsResult)).toEqual(ipfsBytes);
    expect(args.ipfsResult).toHaveLength(IPFS_BYTES_LENGTH);
    expect(args.job).toBe(jobAddr);
    expect(args.run).toBe(runAccount.address);
    expect(args.market).toBe(marketAddr);
    expect(args.authority).toBe(wallet);
    expect(args.vault).toBe(vaultPda);
    expect(instructions).toHaveLength(1);
    expect(instructions[0]).toBeDefined();
  });
});
