export { getScenarioClient, type ScenarioClientOptions } from './setup.js';
export { scenarioVitestSetup } from './vitest-setup-fn.js';
export { defineScenarioVitestConfig } from './vitest-config.js';

// Re-export localnet helpers for convenience
export {
  getLocalnetClient,
  startLocalnet,
  stopLocalnet,
  mintNosTo,
  ensureLocalnetMint,
  executeInstructionPlan,
  type LocalnetClientOptions,
  type LocalnetOptions,
} from '@nosana/localnet';

// Re-export commonly used types so consumers don't need a separate @nosana/kit import
export type { NosanaClient, Wallet, Address } from '@nosana/kit';
export { NosanaNetwork } from '@nosana/kit';
