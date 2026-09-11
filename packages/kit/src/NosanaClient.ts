import { NosanaNetwork } from '@nosana/types';
import { NosanaApiClient } from '@nosana/api';
import { createIpfsClient, NosanaIpfsClient } from '@nosana/ipfs';
import { createNosanaAuthorization, type NosanaAuthorization } from '@nosana/authorization';
import {
  createConnect,
  defaultEndpoints,
  isConnectSession,
  issuerForNetwork,
} from '@nosana/connect';
import type { ConnectFactoryConfig, ConnectSession } from '@nosana/connect';
import type { BrowserConnect } from '@nosana/connect/browser';
import type { ServerConnect } from '@nosana/connect/server';

import { Logger } from './logger/Logger.js';
import {
  APIConfig,
  ClientConfig,
  ConnectInput,
  getNosanaConfig,
  PartialClientConfig,
} from './config/index.js';
import { createJobsProgram, type JobsProgram } from './services/programs/jobs/index.js';
import { createStakeProgram, type StakeProgram } from './services/programs/stake/index.js';
import {
  createMerkleDistributorProgram,
  type MerkleDistributorProgram,
} from './services/programs/merkleDistributor/index.js';
import { createSolanaService, type SolanaService } from './services/solana/index.js';
import { createTokenService, type TokenService } from './services/token/index.js';
import { createApiInstance, NosanaApiDeps } from './utils/createApiInstance.js';
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
  readonly api: NosanaApiClient;
  readonly ipfs: NosanaIpfsClient;
  readonly authorization: NosanaAuthorization;
  readonly logger: Logger;
  /**
   * The "Connect with Nosana" session — present when a `connect` input is
   * provided. Its token is wired into the API client automatically, so
   * `client.api.*` calls are authenticated once signed in. Typed as the common
   * `ConnectSession` (a token source); for the browser login flow, drive it from
   * the `createBrowserConnect(...)` reference you pass in (or cast this).
   */
  readonly connect?: ConnectSession;
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
/**
 * Resolve a `connect` input to a session: pass a session through, or build from
 * config. With no caller `issuer`, default it from the network and pin the
 * endpoints to that host with `defaultEndpoints` (Nosana's fixed SuperTokens
 * layout). This keeps the whole OAuth flow — and its CSRF cookie — on the
 * dashboard API host (the same host the dashboard's SuperTokens uses), rather
 * than the internal host the provider's discovery advertises, which would split
 * the cookie across hosts and fail at consent. A caller-supplied `issuer` still
 * uses normal discovery.
 */
const resolveConnect = (input: ConnectInput, network: NosanaNetwork): ConnectSession => {
  if (isConnectSession(input)) return input;
  if (input.issuer) return createConnect(input);
  const issuer = issuerForNetwork(network);
  if (!issuer) return createConnect(input);
  return createConnect({ ...input, issuer, metadata: input.metadata ?? defaultEndpoints(issuer) });
};

const createClientFromConfig = (config: ClientConfig, network: NosanaNetwork): NosanaClient => {
  const logger = new Logger({ level: config.logLevel });

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
      decimals: 6,
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

  // "Connect with Nosana": use the passed-in session, or build one from config
  // (see the `connect` docs on ClientConfig). Its token is wired into the API
  // client below, so callers never pass api.getToken.
  const connect = config.connect ? resolveConnect(config.connect, network) : undefined;
  const apiConfig: APIConfig | undefined = connect
    ? { ...config.api, getToken: config.api?.getToken ?? (() => connect.getAccessToken()) }
    : config.api;

  const createReactiveNosanaModules = (): {
    authorization: NosanaAuthorization;
    api: NosanaClient['api'];
  } => {
    const authorization = wallet
      ? config.authorization?.store
        ? createNosanaAuthorization(walletToAuthorizationSigner(wallet), {
            identifier: wallet.address.toString(),
            actions: config.authorization.store,
          })
        : createNosanaAuthorization(walletToAuthorizationSigner(wallet))
      : createNosanaAuthorization();

    const apiDeps: NosanaApiDeps = { authorization, solana, nos };

    const api = wallet
      ? createApiInstance(network, apiConfig, wallet, apiDeps)
      : createApiInstance(network, apiConfig, undefined, apiDeps);

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
    connect,
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
};

// Connect config with a secret → the client builds a server session; `client.connect`
// is typed as ServerConnect (getLoginUrl / handleCallback).
export function createNosanaClient(
  network: NosanaNetwork | undefined,
  customConfig: PartialClientConfig & { connect: ConnectFactoryConfig & { clientSecret: string } }
): NosanaClient & { connect: ServerConnect };
// Connect config without a secret → a browser session; `client.connect` is BrowserConnect
// (loginWithRedirect / handleRedirectCallback).
export function createNosanaClient(
  network: NosanaNetwork | undefined,
  customConfig: PartialClientConfig & { connect: ConnectFactoryConfig & { clientSecret?: never } }
): NosanaClient & { connect: BrowserConnect };
// An already-created session → `client.connect` keeps that exact type.
export function createNosanaClient<S extends ConnectSession>(
  network: NosanaNetwork | undefined,
  customConfig: PartialClientConfig & { connect: S }
): NosanaClient & { connect: S };
// No connect input.
export function createNosanaClient(
  network?: NosanaNetwork,
  customConfig?: PartialClientConfig
): NosanaClient;
export function createNosanaClient(
  network: NosanaNetwork = NosanaNetwork.MAINNET,
  customConfig?: PartialClientConfig
): NosanaClient {
  const config = getNosanaConfig(network, customConfig);
  return createClientFromConfig(config, network);
}
