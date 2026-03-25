import type { ProgramConfig } from '../../../../config/index.js';
import type { ProgramDeps, Wallet } from '../../../../types.js';
import type { TokenService } from '../../../../services/token/index.js';
import * as programClient from '@nosana/stake-program';

export type InstructionsHelperParams = {
  deps: ProgramDeps;
  config: ProgramConfig;
  client: typeof programClient;
  getRequiredWallet: () => Wallet;
  getNosATA: TokenService['getATA'];
};
