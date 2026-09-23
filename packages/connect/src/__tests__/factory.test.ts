import { describe, expect, it } from 'vitest';
import { createConnect, isConnectSession } from '../factory.js';
import { issuerForNetwork, DEFAULT_ISSUER } from '../core/index.js';
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

describe('isConnectSession', () => {
  it('is true for a session, false for config', () => {
    expect(isConnectSession({ getAccessToken: async () => 'tok' })).toBe(true);
    expect(isConnectSession({ clientId: 'id', redirectUri: 'https://app.test/cb' })).toBe(false);
  });
});

describe('issuerForNetwork', () => {
  it('maps known networks to the dashboard API auth host', () => {
    expect(issuerForNetwork('mainnet')).toBe(DEFAULT_ISSUER);
    expect(issuerForNetwork('mainnet')).toBe('https://dashboard.k8s.prd.nosana.com/api/auth');
    expect(issuerForNetwork('devnet')).toBe('https://dashboard.k8s.dev.nosana.com/api/auth');
  });

  it('returns undefined for an unknown network', () => {
    expect(issuerForNetwork('localnet')).toBeUndefined();
  });
});
