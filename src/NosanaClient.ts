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
import { Signer } from './types.js';
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
   * The signer. Must be a Signer (supports both message and transaction signing).
   * Set this property directly to configure the signer.
   *
   * @example
   * ```ts
   * import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
   *
   * const client = createNosanaClient(NosanaNetwork.MAINNET);
   * client.signer = mySigner;
   * ```
   */
  signer: Signer | undefined;
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
 * client.signer = mySigner;
 * ```
 */
export function createNosanaClient(
  network: NosanaNetwork = NosanaNetwork.MAINNET,
  customConfig?: PartialClientConfig
): NosanaClient {
  const config = getNosanaConfig(network, customConfig);
  const logger = Logger.getInstance();
  let signer: Signer | undefined = config.signer;

  // Create signer getter
  const getSigner = () => signer;

  // Initialize IPFS
  const ipfs = new IPFS(config.ipfs);

  // Initialize SolanaService first (other services depend on it)
  const solana = createSolanaService({
    rpcEndpoint: config.solana.rpcEndpoint,
    cluster: config.solana.cluster,
    logger,
    getSigner,
  });

  // Initialize NosService with minimal dependencies
  const nos = createNosService({
    nosTokenAddress: config.programs.nosTokenAddress,
    logger,
    solanaRpc: solana.rpc,
  });

  // Create program dependencies
  const programDeps: ProgramDeps = {
    config,
    logger,
    solana,
    getSigner,
  };

  // Initialize programs
  const jobs = createJobsProgram(programDeps);
  const stake = createStakeProgram(programDeps);
  const merkleDistributor = createMerkleDistributorProgram(programDeps);

  // Build and return the client
  return {
    config,
    logger,
    get signer() {
      return signer;
    },
    set signer(value: Signer | undefined) {
      signer = value;
    },
    ipfs,
    solana,
    nos,
    jobs,
    stake,
    merkleDistributor,
  };
}
