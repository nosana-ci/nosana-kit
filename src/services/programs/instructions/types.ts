import type { Address } from '@solana/kit';
import type { ProgramConfig } from '../../../config';
import type { ProgramDeps, Wallet } from '../../../types';
import type { JobsProgram } from '../JobsProgram';
import type { StaticAccounts } from '../../../utils/getStaticAccounts';
import * as programClient from '../../../generated_clients/jobs/index.js';

export type InstructionsHelperParams = {
  deps: ProgramDeps;
  config: ProgramConfig;
  client: typeof programClient;
  get: JobsProgram['get'];
  getRuns: JobsProgram['runs'];
  getRequiredWallet: () => Wallet;
  getStaticAccounts: () => Promise<StaticAccounts>;
};
