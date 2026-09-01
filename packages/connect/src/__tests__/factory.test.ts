import { describe, expect, it } from 'vitest';
import { createConnect } from '../factory.js';
import type { AuthorizationServerMetadata } from '../core/index.js';

const metadata: AuthorizationServerMetadata = {
  issuer: 'https://issuer.test/api/auth',
  authorization_endpoint: 'https://issuer.test/api/auth/oauth/auth',
  token_endpoint: 'https://issuer.test/api/auth/oauth/token',
};

describe('createConnect', () => {
  it('returns a browser session (login flow) when no secret is set', () => {
    const connect = createConnect({ clientId: 'id', redirectUri: 'https://app.test/cb', metadata });
    expect(typeof connect.loginWithRedirect).toBe('function');
    expect(typeof connect.handleRedirectCallback).toBe('function');
  });

  it('returns a server session (getLoginUrl) when a secret is set', () => {
    const connect = createConnect({
      clientId: 'id',
      clientSecret: 'sec',
      redirectUri: 'https://app.test/cb',
      metadata,
    });
    expect(typeof connect.getLoginUrl).toBe('function');
    expect(typeof connect.handleCallback).toBe('function');
    // browser-only method is absent on the server session
    expect((connect as unknown as { loginWithRedirect?: unknown }).loginWithRedirect).toBeUndefined();
  });
});
