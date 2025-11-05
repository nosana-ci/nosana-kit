import { ClientConfig, getNosanaConfig, NosanaNetwork, PartialClientConfig, WalletConfig } from './config/index.js';
import { Logger } from './logger/Logger.js';
import { JobsProgram } from './programs/JobsProgram.js';
import { SolanaService } from './solana/SolanaService.js';
import { NosService } from './solana/NosService.js';
import { IPFS } from './ipfs/IPFS.js';
import { KeyPairSigner } from 'gill';
import { convertWalletConfigToKeyPairSigner } from './utils/walletConverter.js';

export class NosanaClient {
  public readonly config: ClientConfig;
  public readonly jobs: JobsProgram;
  public readonly solana: SolanaService;
  public readonly nos: NosService;
  public readonly ipfs: IPFS;
  public readonly logger: Logger;
  public wallet: KeyPairSigner | undefined;

  constructor(network: NosanaNetwork = NosanaNetwork.MAINNET, customConfig?: PartialClientConfig) {
    this.config = getNosanaConfig(network, customConfig);
    if (this.config.wallet) {
      this.setWallet(this.config.wallet);
    }
    this.jobs = new JobsProgram(this);
    this.logger = Logger.getInstance();
    this.solana = new SolanaService(this);
    this.nos = new NosService(this);
    this.ipfs = new IPFS(this.config.ipfs);
  }
  public async setWallet(wallet: WalletConfig): Promise<KeyPairSigner | undefined> {
    this.wallet = await convertWalletConfigToKeyPairSigner(wallet);
    return this.wallet;
  }
}

// Export types and configuration
export * from './config/index.js';
export * from './errors/NosanaError.js';
export * from './logger/Logger.js';

// Export JobsProgram and related types
export { JobsProgram, JobState, MarketQueueType } from './programs/JobsProgram.js';
export type { Job, Market, Run } from './programs/JobsProgram.js';

// Export IPFS utilities
export * from './ipfs/IPFS.js';

// Export NOS token service
export { NosService } from './solana/NosService.js';
export type { TokenAccount, TokenAccountWithBalance } from './solana/NosService.js';

// Export all generated client types and functions
export * from './generated_clients/jobs/index.js';

// Export dependencies 
export * from 'gill';
