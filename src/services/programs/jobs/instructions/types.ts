import type { ProgramConfig } from '../../../../config/index.js';
import type { ProgramDeps, Wallet } from '../../../../types.js';
import type { JobsProgram } from '../JobsProgram.js';
import type { TokenService } from '../../../../services/token/index.js';
import type { StaticAccounts } from '../../../../utils/getStaticAccounts.js';
import * as programClient from '../../../../generated_clients/jobs/index.js';

export type InstructionsHelperParams = {
  deps: ProgramDeps;
  config: ProgramConfig;
  client: typeof programClient;
  get: JobsProgram['get'];
  getRuns: JobsProgram['runs'];
  getRequiredWallet: () => Wallet;
  getStaticAccounts: () => Promise<StaticAccounts>;
  getNosATA: TokenService['getATA'];
};
