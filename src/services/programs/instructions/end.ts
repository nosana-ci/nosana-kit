import { Address, ProgramDerivedAddressBump } from '@solana/kit';
import * as programClient from '../../../generated_clients/jobs/index.js';
import { JobsProgram } from '../JobsProgram.js';
import { ProgramDeps, Wallet } from '../../../types.js';
import { ProgramConfig } from '../../../config/types.js';
import { StaticAccounts } from '../../../utils/getStaticAccounts.js';

export type EndParams = {
  job: Address;
};

type RequiredHelpers = {
  deps: ProgramDeps;
  config: ProgramConfig;
  client: typeof programClient;
  get: JobsProgram['get'];
  getRequiredWallet: () => Wallet;
  getAssociatedTokenPda: () => Promise<readonly [Address<string>, ProgramDerivedAddressBump]>;
  getStaticAccounts: () => Promise<StaticAccounts>;
};

export type EndInstruction = ReturnType<typeof programClient.getEndInstruction>;

export type End = (params: EndParams) => Promise<EndInstruction>;

export async function end(
  { job }: EndParams,
  { config, deps, client, get, getRequiredWallet, getStaticAccounts }: RequiredHelpers
): Promise<EndInstruction> {
  try {
    const wallet = getRequiredWallet();
    // Get Required accounts
    const { market } = await get(job, false);
    const { jobsProgram } = await getStaticAccounts();
    const vault = await deps.solana.pda([market, config.nosTokenAddress], jobsProgram);

    return client.getEndInstruction({
      job,
      market,
      run: undefined, // Todo: Set these accounts properly
      deposit: undefined, // Todo: Set these accounts properly
      user: undefined, // Todo: Set these accounts properly
      vault: vault,
      payer: wallet.address,
      authority: wallet,
    });
  } catch (err) {
    const errorMessage = `Failed to create end instruction: ${err instanceof Error ? err.message : String(err)}`;
    deps.logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}
