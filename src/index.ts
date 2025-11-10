import {
  ClientConfig,
  getNosanaConfig,
  NosanaNetwork,
  PartialClientConfig,
  WalletConfig,
} from './config/index.js';
import { Logger } from './logger/Logger.js';
import { JobsProgram } from './programs/JobsProgram.js';
import { StakeProgram } from './programs/StakeProgram.js';
import { MerkleDistributorProgram } from './programs/MerkleDistributorProgram.js';
import { SolanaService } from './services/SolanaService.js';
import { NosService } from './services/NosService.js';
import { IPFS } from './ipfs/IPFS.js';
import { KeyPairSigner } from 'gill';
import { convertWalletConfigToKeyPairSigner } from './utils/walletConverter.js';

export class NosanaClient {
  public readonly config: ClientConfig;
  public readonly jobs: JobsProgram;
  public readonly stake: StakeProgram;
  public readonly merkleDistributor: MerkleDistributorProgram;
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
    this.stake = new StakeProgram(this);
    this.merkleDistributor = new MerkleDistributorProgram(this);
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

// Export StakeProgram and related types
export { StakeProgram } from './programs/StakeProgram.js';
export type { Stake } from './programs/StakeProgram.js';

// Export MerkleDistributorProgram and related types
export { MerkleDistributorProgram, ClaimTarget } from './programs/MerkleDistributorProgram.js';
export type { MerkleDistributor, ClaimStatus } from './programs/MerkleDistributorProgram.js';

// Export IPFS utilities
export * from './ipfs/IPFS.js';

// Export NOS token service
export { NosService } from './services/NosService.js';
export type { TokenAccount, TokenAccountWithBalance } from './services/NosService.js';

// Export generated clients under namespaces to avoid naming conflicts
export * as JobsClient from './generated_clients/jobs/index.js';
export * as StakingClient from './generated_clients/staking/index.js';
export * as MerkleDistributorClient from './generated_clients/merkle_distributor/index.js';

// Export dependencies
export * from 'gill';
