import { Address, ProgramDerivedAddressBump } from '@solana/kit';
import * as programClient from '../../../generated_clients/jobs/index.js';
import { JobsProgram } from '../JobsProgram.js';
import { ProgramDeps, Wallet } from '../../../types.js';
import { ProgramConfig } from '../../../config/types.js';
import { StaticAccounts } from '../../../utils/getStaticAccounts.js';

export type ExtendParams = {
  job: Address;
  timeout: number | bigint;
};

type RequiredHelpers = {
  deps: ProgramDeps;
  config: ProgramConfig;
  client: typeof programClient;
  get: JobsProgram['get'];
  getRuns: JobsProgram['runs'];
  getRequiredWallet: () => Wallet;
  getAssociatedTokenPda: () => Promise<readonly [Address<string>, ProgramDerivedAddressBump]>;
  getStaticAccounts: () => Promise<StaticAccounts>;
};

export type ExtendInstruction = ReturnType<typeof programClient.getExtendInstruction>;

export type Extend = (params: ExtendParams) => Promise<ExtendInstruction>;

export async function extend(
  { job, timeout }: ExtendParams,
  {
    config,
    deps,
    client,
    get,
    getRequiredWallet,
    getAssociatedTokenPda,
    getStaticAccounts,
  }: RequiredHelpers
): Promise<ExtendInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [{ market }, [associatedTokenAddress], { jobsProgram, ...staticAccounts }] =
      await Promise.all([get(job, false), getAssociatedTokenPda(), getStaticAccounts()]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    // Create the extend instruction
    return client.getExtendInstruction({
      job,
      timeout,
      market,
      vault,
      payer: wallet,
      authority: wallet,
      user: associatedTokenAddress,
      ...staticAccounts,
    });
  } catch (err) {
    const errorMessage = `Failed to create list instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
