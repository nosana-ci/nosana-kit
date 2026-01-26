import { generateKeyPairSigner } from '@solana/kit';
import { createLocalnetClient, type NosanaClient } from '../../../src/index.js';
import { mintNosTo } from './utils.js';

type GlobalWithClient = typeof globalThis & {
  __NOSANA_LOCALNET_CLIENT__?: Promise<NosanaClient>;
};

const globalWithClient = globalThis as GlobalWithClient;
async function createClient(): Promise<NosanaClient> {
  const payer = await generateKeyPairSigner();
  const client = createLocalnetClient({
    wallet: payer,
  });

  const balance = await client.solana.getBalance(payer.address);
  if (balance === 0) {
    await client.solana.airdrop({
      recipient: payer.address,
      amount: 2_000_000_000n,
    });
  }

  await mintNosTo(client, payer.address, 1_000_000_000n);

  return client;
}

export function getLocalnetClient(): Promise<NosanaClient> {
  if (!globalWithClient.__NOSANA_LOCALNET_CLIENT__) {
    globalWithClient.__NOSANA_LOCALNET_CLIENT__ = createClient();
  }
  return globalWithClient.__NOSANA_LOCALNET_CLIENT__;
}

