import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createServerConnect } from '../index.js';
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

describe('createServerConnect', () => {
  let store: ConnectStore;
  beforeEach(() => {
    store = memoryStore();
  });

  it('requires a clientSecret', () => {
    expect(() => createServerConnect({ clientId: 'id', metadata })).toThrow(/clientSecret/);
  });

  it('builds a login URL (no PKCE) and remembers the request', async () => {
    const connect = createServerConnect({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
      store,
    });

    const url = new URL(await connect.getLoginUrl({ appState: { returnTo: '/dash' } }));
    expect(url.origin + url.pathname).toBe(metadata.authorization_endpoint);
    expect(url.searchParams.get('client_id')).toBe('id');
    expect(url.searchParams.get('code_challenge')).toBeNull(); // confidential → no PKCE
    const pending = JSON.parse((await store.get(PENDING_KEY))!);
    expect(pending.state).toBe(url.searchParams.get('state'));
    expect(pending.appState).toEqual({ returnTo: '/dash' });
  });

  it('completes the callback with Basic auth, stores tokens, restores appState', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ access_token: 'at', token_type: 'bearer', expires_in: 3600, refresh_token: 'rt' }),
    );
    const connect = createServerConnect({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
      store,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const url = new URL(await connect.getLoginUrl({ appState: { returnTo: '/dash' } }));
    const state = url.searchParams.get('state')!;

    const result = await connect.handleCallback(`https://app.test/cb?code=abc&state=${state}`);
    expect(result.tokens.access_token).toBe('at');
    expect(result.appState).toEqual({ returnTo: '/dash' });
    expect(await connect.isAuthenticated()).toBe(true);
    expect(await connect.getAccessToken()).toBe('at');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${btoa('id:sec')}`);
    const body = new URLSearchParams(init.body as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code_verifier')).toBeNull();
  });

  it('rejects a state mismatch (CSRF protection)', async () => {
    const connect = createServerConnect({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
      store,
    });
    await connect.getLoginUrl();
    await expect(
      connect.handleCallback('https://app.test/cb?code=abc&state=attacker'),
    ).rejects.toThrow(/state mismatch/);
  });

  it('refreshes an expired access token', async () => {
    let n = 0;
    const fetchMock = vi.fn(async () => {
      n += 1;
      return jsonResponse({
        access_token: n === 1 ? 'old' : 'new',
        token_type: 'bearer',
        expires_in: n === 1 ? -10 : 3600,
        refresh_token: 'rt',
      });
    });
    const connect = createServerConnect({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
      store,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const url = new URL(await connect.getLoginUrl());
    const state = url.searchParams.get('state')!;
    await connect.handleCallback(`https://app.test/cb?code=abc&state=${state}`);

    expect(await connect.getAccessToken()).toBe('new');
    expect(n).toBe(2);
  });
});
