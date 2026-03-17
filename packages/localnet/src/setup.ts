import { generateKeyPairSigner } from '@solana/kit';
import {
  createLocalnetClient,
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

type GlobalWithClient = typeof globalThis & {
  __NOSANA_LOCALNET_CLIENT__?: Promise<NosanaClient>;
};

const globalWithClient = globalThis as GlobalWithClient;

async function createLocalnetClientInstance(
  options: LocalnetClientOptions = {}
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
 *
 * @example
 * ```ts
 * const client = await getLocalnetClient();
 * ```
 */
export function getLocalnetClient(options?: LocalnetClientOptions): Promise<NosanaClient> {
  if (!globalWithClient.__NOSANA_LOCALNET_CLIENT__) {
    globalWithClient.__NOSANA_LOCALNET_CLIENT__ = createLocalnetClientInstance(options);
  }
  return globalWithClient.__NOSANA_LOCALNET_CLIENT__;
}
