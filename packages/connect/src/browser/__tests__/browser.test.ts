import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBrowserConnect } from '../index.js';
import { memoryStore } from '../../core/index.js';
import type { AuthorizationServerMetadata, ConnectStore } from '../../core/index.js';

const metadata: AuthorizationServerMetadata = {
  issuer: 'https://issuer.test/api/auth',
  authorization_endpoint: 'https://issuer.test/api/auth/oauth/auth',
  token_endpoint: 'https://issuer.test/api/auth/oauth/token',
};

const PENDING_KEY = 'nosana-connect:pending';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('createBrowserConnect', () => {
  let store: ConnectStore;
  beforeEach(() => {
    store = memoryStore();
  });

  it('completes the callback, stores tokens, and restores appState', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ access_token: 'at', token_type: 'bearer', expires_in: 3600, refresh_token: 'rt' }),
    );
    const connect = createBrowserConnect({
      clientId: 'stcl_1',
      redirectUri: 'https://app.test/cb',
      metadata,
      store,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await store.set(
      PENDING_KEY,
      JSON.stringify({ state: 'xyz', codeVerifier: 'ver', redirectUri: 'https://app.test/cb', appState: { returnTo: '/dash' } }),
    );

    const result = await connect.handleRedirectCallback('https://app.test/cb?code=abc&state=xyz');
    expect(result.tokens.access_token).toBe('at');
    expect(result.appState).toEqual({ returnTo: '/dash' });
    expect(await connect.isAuthenticated()).toBe(true);
    expect(await connect.getAccessToken()).toBe('at');
    expect(await store.get(PENDING_KEY)).toBeNull();
  });

  it('rejects a state mismatch (CSRF protection)', async () => {
    const connect = createBrowserConnect({ clientId: 'stcl_1', redirectUri: 'https://app.test/cb', metadata, store });
    await store.set(PENDING_KEY, JSON.stringify({ state: 'expected', redirectUri: 'https://app.test/cb' }));
    await expect(
      connect.handleRedirectCallback('https://app.test/cb?code=abc&state=attacker'),
    ).rejects.toThrow(/state mismatch/);
  });

  it('surfaces an error param returned to the callback', async () => {
    const connect = createBrowserConnect({ clientId: 'stcl_1', redirectUri: 'https://app.test/cb', metadata, store });
    await expect(
      connect.handleRedirectCallback('https://app.test/cb?error=access_denied&error_description=nope'),
    ).rejects.toThrow(/access_denied/);
  });

  it('transparently refreshes an expired access token', async () => {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      return jsonResponse({
        access_token: call === 1 ? 'old' : 'new',
        token_type: 'bearer',
        expires_in: call === 1 ? -10 : 3600,
        refresh_token: 'rt',
      });
    });
    const connect = createBrowserConnect({
      clientId: 'stcl_1',
      redirectUri: 'https://app.test/cb',
      metadata,
      store,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await store.set(PENDING_KEY, JSON.stringify({ state: 'xyz', codeVerifier: 'ver', redirectUri: 'https://app.test/cb' }));
    await connect.handleRedirectCallback('https://app.test/cb?code=abc&state=xyz');

    const token = await connect.getAccessToken();
    expect(token).toBe('new');
    expect(call).toBe(2);
  });
});
