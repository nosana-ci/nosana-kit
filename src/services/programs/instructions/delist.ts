import { Address, ProgramDerivedAddressBump } from '@solana/kit';
import * as programClient from '../../../generated_clients/jobs/index.js';
import { JobsProgram } from '../JobsProgram.js';
import { ProgramDeps, Wallet } from '../../../types.js';
import { ProgramConfig } from '../../../config/types.js';
import { StaticAccounts } from '../../../utils/getStaticAccounts.js';

export type DelistParams = {
  job: Address;
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

export type DelistInstruction = ReturnType<typeof programClient.getDelistInstruction>;

export type Delist = (params: DelistParams) => Promise<DelistInstruction>;

export async function delist(
  { job }: DelistParams,
  { config, deps, client, get, getRequiredWallet, getStaticAccounts }: RequiredHelpers
): Promise<DelistInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const [{ market }, { jobsProgram }] = await Promise.all([get(job, false), getStaticAccounts()]);
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    return client.getDelistInstruction({
      job,
      market,
      vault,
      deposit: undefined, // Todo: Set account properly
      payer: wallet.address,
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create delist instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
