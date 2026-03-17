import fs from 'fs';
import { createKeyPairSignerFromBytes } from '@solana/kit';
import { createNosanaClient, NosanaNetwork, type NosanaClient } from '@nosana/kit';
import { getLocalnetClient, type LocalnetClientOptions } from '@nosana/localnet';

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

type GlobalWithClient = typeof globalThis & {
  __NOSANA_SCENARIO_CLIENT__?: Promise<NosanaClient>;
};

const globalWithClient = globalThis as GlobalWithClient;

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
  if (!globalWithClient.__NOSANA_SCENARIO_CLIENT__) {
    globalWithClient.__NOSANA_SCENARIO_CLIENT__ = createScenarioClientInstance(options);
  }
  return globalWithClient.__NOSANA_SCENARIO_CLIENT__;
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
