import { NosanaNetwork } from '@nosana/types';
import { createIpfsClient } from '@nosana/ipfs';
import { createNosanaApi, type NosanaApi } from '@nosana/api';
import { createNosanaAuthorization, type NosanaAuthorization } from '@nosana/authorization';

import { Logger } from './logger/Logger.js';
import { ClientConfig, getNosanaConfig, PartialClientConfig } from './config/index.js';
import { createJobsProgram, type JobsProgram } from './services/programs/jobs/index.js';
import { createStakeProgram, type StakeProgram } from './services/programs/stake/index.js';
import {
  createMerkleDistributorProgram,
  type MerkleDistributorProgram,
} from './services/programs/merkleDistributor/index.js';
import { createSolanaService, type SolanaService } from './services/solana/index.js';
import { createTokenService, type TokenService } from './services/token/index.js';
import { walletToAuthorizationSigner } from './utils/walletToAuthorizationSigner.js';

import type { Wallet } from './types.js';
import type { ProgramDeps } from './types.js';
/**
 * The Nosana client interface. Contains all the services and programs
 * needed to interact with the Nosana network.
 * @group @nosana/kit
 */
export interface NosanaClient {
  readonly config: ClientConfig;
  readonly jobs: JobsProgram;
  readonly stake: StakeProgram;
  readonly merkleDistributor: MerkleDistributorProgram;
  readonly solana: SolanaService;
  readonly nos: TokenService;
  readonly api: NosanaApi | undefined;
  readonly ipfs: ReturnType<typeof createIpfsClient>;
  readonly authorization: NosanaAuthorization;
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

  // Wallet management
  let wallet: Wallet | undefined = config.wallet;
  const getWallet = () => wallet;

  // Create Solana services
  const solana = createSolanaService(
    {
      logger,
      getWallet,
    },
    config.solana
  );

  // Initialize TokenService with minimal dependencies
  const nos = createTokenService(
    {
      logger,
      solana,
      getWallet,
    },
    {
      tokenAddress: config.programs.nosTokenAddress,
    }
  );

  // Create program dependencies
  const programDeps: ProgramDeps = {
    logger,
    solana,
    nos,
    getWallet,
  };

  // Initialize programs
  const jobs = createJobsProgram(programDeps, config.programs);
  const stake = createStakeProgram(programDeps, config.programs);
  const merkleDistributor = createMerkleDistributorProgram(programDeps, config.programs);

  // Initialize Nosana Modules
  const ipfs = createIpfsClient(config.ipfs);

  const createReactiveNosanaModules = (): {
    authorization: NosanaAuthorization;
    api: NosanaClient['api'] | undefined;
  } => {
    const authorization = wallet
      ? createNosanaAuthorization(walletToAuthorizationSigner(wallet))
      : createNosanaAuthorization();

    // Use API key if provided, otherwise fall back to wallet-based auth
    const api = config.api?.apiKey
      ? createNosanaApi(network, config.api.apiKey)
      : wallet
        ? createNosanaApi(network, {
            identifier: wallet.address.toString(),
            generate: (authorization as NosanaAuthorization).generate,
          })
        : undefined;

    return {
      authorization,
      api,
    };
  };

  let reactiveNosanaModules = createReactiveNosanaModules();

  // Build and return the client
  return {
    config,
    logger,
    solana,
    nos,
    jobs,
    stake,
    merkleDistributor,
    ipfs,
    get authorization() {
      return reactiveNosanaModules.authorization;
    },
    get api() {
      return reactiveNosanaModules.api;
    },
    get wallet() {
      return wallet;
    },
    set wallet(value: Wallet | undefined) {
      wallet = value;
      reactiveNosanaModules = createReactiveNosanaModules();
    },
  };
}
