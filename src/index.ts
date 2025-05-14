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

// Export types
export * from './config/index.js';
export * from './errors/NosanaError.js';
export * from './logger/Logger.js'; 