export { getLocalnetClient, type LocalnetClientOptions } from './setup.js';
export { startLocalnet, stopLocalnet, type LocalnetOptions } from './docker.js';
export {
  mintNosTo,
  ensureLocalnetMint,
  executeInstructionPlan,
  loadMintKeypairSigner,
  loadMintAuthoritySigner,
} from './utils.js';
// Note: vitest-setup.ts has a top-level await side-effect and should only
// be used as a vitest setupFile, not re-exported here.
export { localnetVitestSetup } from './vitest-setup-fn.js';
export { defineLocalnetVitestConfig } from './vitest-config.js';

// Re-export commonly used types so consumers don't need a separate @nosana/kit import
export type { NosanaClient, Wallet, Address } from '@nosana/kit';
export { NosanaNetwork } from '@nosana/kit';
