import { describe, expect, it, vi } from 'vitest';
import { createConnectSession } from '../session.js';
import { memoryStore } from '../store.js';
import { NosanaConnectClient } from '../client.js';
import type { AuthorizationServerMetadata, ConnectStore } from '../types.js';

const metadata: AuthorizationServerMetadata = {
  issuer: 'https://issuer.test/api/auth',
  authorization_endpoint: 'https://issuer.test/api/auth/oauth/auth',
  token_endpoint: 'https://issuer.test/api/auth/oauth/token',
};

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response;
}

/** A store that counts get() calls, so we can prove the cache avoids re-reads. */
function countingStore(): { store: ConnectStore; getCount: () => number } {
  const inner = memoryStore();
  let gets = 0;
  return {
    store: {
      get: (k) => {
        gets += 1;
        return inner.get(k);
      },
      set: (k, v) => inner.set(k, v),
      remove: (k) => inner.remove(k),
    },
    getCount: () => gets,
  };
}

async function signIn(session: ReturnType<typeof createConnectSession>): Promise<void> {
  const url = new URL(await session.start());
  const state = url.searchParams.get('state')!;
  await session.complete(`https://app.test/cb?code=abc&state=${state}`);
}

describe('createConnectSession token cache', () => {
  function client() {
    const fetchMock = vi.fn(async () => jsonResponse({ access_token: 'at', token_type: 'bearer', expires_in: 3600 }));
    return new NosanaConnectClient({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
  }

  it('serves the token from memory without re-reading the store when cacheTokens is on', async () => {
    const { store, getCount } = countingStore();
    const session = createConnectSession(client(), store, { redirectUri: 'https://app.test/cb', cacheTokens: true });
    await signIn(session); // complete() populates the cache
    const before = getCount();

    expect(await session.getAccessToken()).toBe('at');
    expect(await session.getAccessToken()).toBe('at');
    expect(await session.isAuthenticated()).toBe(true);

    expect(getCount()).toBe(before); // no further store reads
  });

  it('reads the store fresh every call when cacheTokens is off (shared-store safety)', async () => {
    const { store, getCount } = countingStore();
    const session = createConnectSession(client(), store, { redirectUri: 'https://app.test/cb', cacheTokens: false });
    await signIn(session);
    const before = getCount();

    await session.getAccessToken();
    await session.getAccessToken();

    expect(getCount()).toBeGreaterThan(before); // re-read each time
  });
});
