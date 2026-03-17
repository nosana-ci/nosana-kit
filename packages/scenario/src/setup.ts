import fs from 'fs';
import { createKeyPairSignerFromBytes, generateKeyPairSigner } from '@solana/kit';
import {
  createLocalnetClient,
  createNosanaClient,
  NosanaNetwork,
  type NosanaClient,
  type PartialClientConfig,
  type Wallet,
} from '@nosana/kit';
import { mintNosTo } from './utils.js';

export interface LocalnetClientOptions {
  /**
   * Wallet to use. If not provided, a random keypair is generated and funded.
   */
  wallet?: Wallet;

  /**
   * Amount of SOL (in lamports) to airdrop. Default: 2 SOL.
   */
  airdropAmount?: bigint;

  /**
   * Amount of NOS (in raw token units) to mint. Default: 1 000 000 000.
   */
  mintAmount?: bigint;

  /**
   * Additional Nosana client config overrides.
   */
  config?: PartialClientConfig;
}

export interface ScenarioClientOptions extends LocalnetClientOptions {
  /**
   * Network to run scenarios against. Defaults to `'localnet'`.
   * Can also be set via the `NOSANA_NETWORK` environment variable.
   *
   * - `'localnet'` — connects to `http://127.0.0.1:8899`, generates a keypair,
   *   airdrops SOL, and mints NOS tokens.
   * - `'devnet'` / `'mainnet'` — connects to the respective Nosana network.
   *   Requires a funded wallet (via `wallet` option or `NOSANA_WALLET` env var
   *   pointing to a Solana keypair JSON file).
   */
  network?: 'localnet' | 'devnet' | 'mainnet';
}

type GlobalWithLocalnetClient = typeof globalThis & {
  __NOSANA_LOCALNET_CLIENT__?: Promise<NosanaClient>;
};

type GlobalWithScenarioClient = typeof globalThis & {
  __NOSANA_SCENARIO_CLIENT__?: Promise<NosanaClient>;
};

const globalWithLocalnet = globalThis as GlobalWithLocalnetClient;
const globalWithScenario = globalThis as GlobalWithScenarioClient;

// ---------------------------------------------------------------------------
// Localnet client
// ---------------------------------------------------------------------------

async function createLocalnetClientInstance(
  options: LocalnetClientOptions = {},
): Promise<NosanaClient> {
  const wallet = options.wallet ?? (await generateKeyPairSigner());
  const client = createLocalnetClient({ ...options.config, wallet });

  const balance = await client.solana.getBalance(wallet.address);
  if (balance === 0) {
    await client.solana.airdrop({
      recipient: wallet.address,
      amount: options.airdropAmount ?? 2_000_000_000n,
    });
  }

  await mintNosTo(client, wallet.address, options.mintAmount ?? 1_000_000_000n);
  return client;
}

/**
 * Returns a cached Nosana client connected to localnet.
 *
 * Generates a random keypair, airdrops SOL, and mints NOS tokens automatically.
 */
export function getLocalnetClient(options?: LocalnetClientOptions): Promise<NosanaClient> {
  if (!globalWithLocalnet.__NOSANA_LOCALNET_CLIENT__) {
    globalWithLocalnet.__NOSANA_LOCALNET_CLIENT__ = createLocalnetClientInstance(options);
  }
  return globalWithLocalnet.__NOSANA_LOCALNET_CLIENT__;
}

// ---------------------------------------------------------------------------
// Scenario client (network-aware)
// ---------------------------------------------------------------------------

/**
 * Load a wallet from a Solana keypair JSON file.
 */
async function loadWalletFromFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const bytes = new Uint8Array(JSON.parse(raw));
  return createKeyPairSignerFromBytes(bytes);
}

/**
 * Returns a cached Nosana client for scenario tests, aware of the target network.
 *
 * The network is determined by (in order of precedence):
 * 1. `options.network`
 * 2. `NOSANA_NETWORK` environment variable
 * 3. `'localnet'` (default)
 *
 * The wallet is determined by (in order of precedence):
 * 1. `options.wallet`
 * 2. `NOSANA_WALLET` environment variable (path to a Solana keypair JSON file)
 *
 * On localnet: delegates to {@link getLocalnetClient} from `@nosana/localnet`.
 * On devnet / mainnet: connects using the provided wallet (required).
 *
 * @example
 * ```ts
 * // Localnet (default — zero config)
 * const client = await getScenarioClient();
 *
 * // Devnet via env vars (no code changes needed)
 * // NOSANA_NETWORK=devnet NOSANA_WALLET=~/.config/solana/id.json
 * const client = await getScenarioClient();
 *
 * // Devnet with explicit options
 * const client = await getScenarioClient({
 *   network: 'devnet',
 *   wallet: myDevnetWallet,
 * });
 * ```
 */
export function getScenarioClient(options?: ScenarioClientOptions): Promise<NosanaClient> {
  if (!globalWithScenario.__NOSANA_SCENARIO_CLIENT__) {
    globalWithScenario.__NOSANA_SCENARIO_CLIENT__ = createScenarioClientInstance(options);
  }
  return globalWithScenario.__NOSANA_SCENARIO_CLIENT__;
}

async function createScenarioClientInstance(
  options?: ScenarioClientOptions
): Promise<NosanaClient> {
  const network =
    options?.network ??
    (process.env.NOSANA_NETWORK as ScenarioClientOptions['network']) ??
    'localnet';

  if (network === 'localnet') {
    return getLocalnetClient(options);
  }

  const wallet = options?.wallet ?? (await resolveWalletFromEnv());
  if (!wallet) {
    throw new Error(
      `A funded wallet is required on ${network}. ` +
        'Provide it via ScenarioClientOptions.wallet or set the NOSANA_WALLET ' +
        'environment variable to a Solana keypair JSON file path.'
    );
  }

  const nosanaNetwork = network === 'mainnet' ? NosanaNetwork.MAINNET : NosanaNetwork.DEVNET;
  return createNosanaClient(nosanaNetwork, { ...options?.config, wallet });
}

async function resolveWalletFromEnv() {
  const walletPath = process.env.NOSANA_WALLET;
  if (!walletPath) return undefined;
  return loadWalletFromFile(walletPath);
}
