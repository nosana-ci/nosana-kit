import { describe, expect, it } from 'vitest';
import { createNosanaClient, NosanaNetwork } from '../../src/index.js';

// Discovery fails → the client falls back to constructed endpoints off the
// issuer, so the authorize URL reveals which issuer host the network selected.
const failingFetch = (async () => {
  throw new Error('no network in test');
}) as unknown as typeof fetch;

function serverConnectClient(network: NosanaNetwork, issuer?: string) {
  return createNosanaClient(network, {
    connect: {
      clientId: 'stcl_test',
      clientSecret: 'secret', // server session → getLoginUrl (no window needed)
      redirectUri: 'https://app.test/callback',
      issuer,
      fetch: failingFetch,
    },
  });
}

describe('connect issuer defaults from network', () => {
  it('devnet → dev dashboard API auth', async () => {
    const client = serverConnectClient(NosanaNetwork.DEVNET);
    const url = await client.connect.getLoginUrl();
    expect(url).toContain('https://dashboard.k8s.dev.nosana.com/api/auth/oauth/auth');
  });

  it('mainnet → prod dashboard API auth', async () => {
    const client = serverConnectClient(NosanaNetwork.MAINNET);
    const url = await client.connect.getLoginUrl();
    expect(url).toContain('https://dashboard.k8s.prd.nosana.com/api/auth/oauth/auth');
  });

  it('an explicit issuer overrides the network default', async () => {
    const client = serverConnectClient(NosanaNetwork.DEVNET, 'https://custom.example/api/auth');
    const url = await client.connect.getLoginUrl();
    expect(url).toContain('https://custom.example/api/auth/oauth/auth');
  });
});
