export {
  getScenarioClient,
  getLocalnetClient,
  type ScenarioClientOptions,
  type LocalnetClientOptions,
} from './setup.js';
export {
  mintNosTo,
  ensureLocalnetMint,
  executeInstructionPlan,
  loadMintKeypairSigner,
  loadMintAuthoritySigner,
} from './utils.js';
export {
  createMarket,
  closeMarket,
  listJob,
  joinMarketQueue,
  waitForJobState,
  finishJob,
  verifyJobAssignedToNode,
  type JoinMarketQueueOptions,
  type VerifyJobAssignedOptions,
} from './helpers/index.js';
export { scenarioVitestSetup } from './vitest-setup-fn.js';
export { defineScenarioVitestConfig } from './vitest-config.js';

// Re-export localnet helpers for convenience
export {
  startLocalnet,
  stopLocalnet,
  LOCALNET_RPC_ENDPOINT,
  LOCALNET_WS_ENDPOINT,
  type LocalnetOptions,
} from '@nosana/localnet';

// Re-export commonly used types so consumers don't need a separate @nosana/kit import
export type { NosanaClient, Wallet, Address } from '@nosana/kit';
export { NosanaNetwork, JobState } from '@nosana/kit';
