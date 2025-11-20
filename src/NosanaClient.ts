import {
  ClientConfig,
  getNosanaConfig,
  NosanaNetwork,
  PartialClientConfig,
} from './config/index.js';
import { Logger } from './logger/Logger.js';
import { createJobsProgram, type JobsProgram } from './services/programs/JobsProgram.js';
import { createStakeProgram, type StakeProgram } from './services/programs/StakeProgram.js';
import {
  createMerkleDistributorProgram,
  type MerkleDistributorProgram,
} from './services/programs/MerkleDistributorProgram.js';
import { createSolanaService, type SolanaService } from './services/SolanaService.js';
import { createNosService, type NosService } from './services/NosService.js';
import { IPFS } from './ipfs/IPFS.js';
import { Wallet } from './types.js';
import type { ProgramDeps } from './types.js';

/**
 * The Nosana client interface. Contains all the services and programs
 * needed to interact with the Nosana network.
 */
export interface NosanaClient {
  readonly config: ClientConfig;
  readonly jobs: JobsProgram;
  readonly stake: StakeProgram;
  readonly merkleDistributor: MerkleDistributorProgram;
  readonly solana: SolanaService;
  readonly nos: NosService;
  readonly ipfs: IPFS;
  readonly logger: Logger;
  /**
   * The wallet. Must be a Wallet (supports both message and transaction signing).
   * Set this property directly to configure the wallet.
   *
   * @example
   * ```ts
   * import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
   *
   * const client = createNosanaClient(NosanaNetwork.MAINNET);
   * client.wallet = myWallet;
   * ```
   */
  wallet: Wallet | undefined;
}

/**
 * Creates a new Nosana client instance.
 *
 *
 * @param network - The network to connect to (default: MAINNET)
 * @param customConfig - Optional custom configuration to override defaults
 * @returns A Nosana client instance with all services and programs
 *
 * @example
 * ```ts
 * import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
 *
 * const client = createNosanaClient(NosanaNetwork.MAINNET);
 * client.wallet = myWallet;
 * ```
 */
export function createNosanaClient(
  network: NosanaNetwork = NosanaNetwork.MAINNET,
  customConfig?: PartialClientConfig
): NosanaClient {
  const config = getNosanaConfig(network, customConfig);

  const logger = Logger.getInstance({ level: config.logLevel });

  let wallet: Wallet | undefined = config.wallet;

  // Create wallet getter
  const getWallet = () => wallet;

  // Initialize IPFS
  const ipfs = new IPFS(config.ipfs);

  // Initialize SolanaService first (other services depend on it)
  const solana = createSolanaService(
    {
      logger,
      getWallet,
    },
    config.solana
  );

  // Initialize NosService with minimal dependencies
  const nos = createNosService(
    {
      logger,
      solanaRpc: solana.rpc,
    },
    {
      nosTokenAddress: config.programs.nosTokenAddress,
    }
  );

  // Create program dependencies
  const programDeps: ProgramDeps = {
    config,
    logger,
    solana,
    getWallet,
  };

  // Initialize programs
  const jobs = createJobsProgram(programDeps);
  const stake = createStakeProgram(programDeps);
  const merkleDistributor = createMerkleDistributorProgram(programDeps);

  // Build and return the client
  return {
    config,
    logger,
    get wallet() {
      return wallet;
    },
    set wallet(value: Wallet | undefined) {
      wallet = value;
    },
    ipfs,
    solana,
    nos,
    jobs,
    stake,
    merkleDistributor,
  };
}
