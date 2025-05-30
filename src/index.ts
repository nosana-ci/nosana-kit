import { ClientConfig, getNosanaConfig, NosanaNetwork, PartialClientConfig } from './config/index.js';
import { Logger } from './logger/Logger.js';
import { JobsProgram } from './programs/JobsProgram.js';
import { SolanaUtils } from './solana/SolanaUtils.js';

export class NosanaClient {
  public readonly config: ClientConfig;
  public readonly jobs: JobsProgram;
  public readonly solana: SolanaUtils;
  public readonly logger: Logger;

  constructor(network: NosanaNetwork = NosanaNetwork.MAINNET, customConfig?: PartialClientConfig) {
    this.config = getNosanaConfig(network, customConfig);
    this.jobs = new JobsProgram(this);
    this.logger = Logger.getInstance();
    this.solana = new SolanaUtils(this);
  }
}

// Export types and configuration
export * from './config/index.js';
export * from './errors/NosanaError.js';
export * from './logger/Logger.js';

// Export JobsProgram and related types
export { JobsProgram } from './programs/JobsProgram.js';
export type { Job, Market, Run } from './programs/JobsProgram.js';

// Export IPFS utilities
export * from './ipfs/IPFS.js';
// Export all generated client types and functions
export * from './generated_clients/jobs/index.js';

// Export dependencies
export * from 'gill';