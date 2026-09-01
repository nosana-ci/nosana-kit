import { afterEach, describe, expect, it, vi } from 'vitest';
import { NosanaConnectClient } from '../client.js';
import type { AuthorizationServerMetadata } from '../types.js';

const metadata: AuthorizationServerMetadata = {
  issuer: 'https://issuer.test/api/auth',
  authorization_endpoint: 'https://issuer.test/api/auth/oauth/auth',
  token_endpoint: 'https://issuer.test/api/auth/oauth/token',
  userinfo_endpoint: 'https://issuer.test/api/auth/oauth/userinfo',
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('NosanaConnectClient', () => {
  it('builds a public (PKCE) authorize URL', async () => {
    const client = new NosanaConnectClient({
      clientId: 'stcl_1',
      redirectUri: 'https://app.test/cb',
      metadata,
    });
    const req = await client.createAuthorizationRequest();
    const url = new URL(req.url);
    expect(url.origin + url.pathname).toBe(metadata.authorization_endpoint);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('stcl_1');
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.test/cb');
    expect(url.searchParams.get('scope')).toBe('openid offline_access');
    expect(url.searchParams.get('state')).toBe(req.state);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('nonce')).toBe(req.nonce);
    expect(req.codeVerifier).toBeTruthy();
  });

  it('omits PKCE for confidential clients', async () => {
    const client = new NosanaConnectClient({
      clientId: 'stcl_2',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
    });
    const req = await client.createAuthorizationRequest();
    expect(new URL(req.url).searchParams.get('code_challenge')).toBeNull();
    expect(req.codeVerifier).toBeUndefined();
  });

  it('exchanges an authorization code with the verifier', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ access_token: 'at', token_type: 'bearer', expires_in: 3600, refresh_token: 'rt' }),
    );
    const client = new NosanaConnectClient({
      clientId: 'stcl_1',
      redirectUri: 'https://app.test/cb',
      metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const tokens = await client.exchangeCode({ code: 'abc', codeVerifier: 'ver' });
    expect(tokens.access_token).toBe('at');

    const [endpoint, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe(metadata.token_endpoint);
    const body = new URLSearchParams(init.body as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('abc');
    expect(body.get('code_verifier')).toBe('ver');
    expect(body.get('client_id')).toBe('stcl_1');
  });

  it('sends Basic auth for confidential token requests', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ access_token: 'at', token_type: 'bearer' }));
    const client = new NosanaConnectClient({
      clientId: 'id',
      clientSecret: 's3cret',
      redirectUri: 'https://app.test/cb',
      metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.exchangeCode({ code: 'abc' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${btoa('id:s3cret')}`);
  });

  it('refreshes tokens', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ access_token: 'at2', token_type: 'bearer' }));
    const client = new NosanaConnectClient({
      clientId: 'stcl_1',
      redirectUri: 'https://app.test/cb',
      metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
    const tokens = await client.refresh('rt');
    expect(tokens.access_token).toBe('at2');
    const body = new URLSearchParams((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('rt');
  });

  it('throws a helpful error when a token request fails', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'invalid_grant' }, false, 400));
    const client = new NosanaConnectClient({
      clientId: 'stcl_1',
      redirectUri: 'https://app.test/cb',
      metadata,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await expect(client.exchangeCode({ code: 'bad' })).rejects.toThrow(/400/);
  });
});

describe('default fetch binding (browser "Illegal invocation" regression)', () => {
  const original = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = original;
  });

  it('invokes the default fetch bound to the global, not the client instance', async () => {
    // Emulate a browser: `fetch` throws when called with a non-global `this`
    // (Node's fetch does not, which is why the original bug slipped through).
    const seenThis: unknown[] = [];
    globalThis.fetch = function (this: unknown) {
      seenThis.push(this);
      if (this !== undefined && this !== globalThis) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
      }
      return Promise.resolve(jsonResponse({ access_token: 'at', token_type: 'bearer' }));
    } as unknown as typeof fetch;

    // No custom fetch → the client must bind the global default.
    const client = new NosanaConnectClient({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata, // avoids a discovery fetch
    });

    const tokens = await client.exchangeCode({ code: 'abc' });
    expect(tokens.access_token).toBe('at');
    expect(seenThis).toContain(globalThis);
  });
});
