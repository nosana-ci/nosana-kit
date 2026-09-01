import { createConnectSession, NosanaConnectClient } from '../core/index.js';
import type { CallbackResult, ConnectSessionConfig, ConnectStore, LoginOptions } from '../core/index.js';

export type { CallbackResult } from '../core/index.js';
/** Options for {@link BrowserConnect.loginWithRedirect}. */
export type LoginRedirectOptions = LoginOptions;

export interface BrowserConnect {
  /** Generate PKCE + state, persist them, and redirect to the authorize URL. */
  loginWithRedirect(options?: LoginRedirectOptions): Promise<void>;
  /** Handle the redirect back: verify state, exchange the code, store tokens. */
  handleRedirectCallback(url?: string): Promise<CallbackResult>;
  isAuthenticated(): Promise<boolean>;
  /** A valid access token, transparently refreshed when near expiry. */
  getAccessToken(): Promise<string>;
  getIdTokenClaims(): Promise<Record<string, unknown> | null>;
  getUser(): Promise<Record<string, unknown> | null>;
  logout(): Promise<void>;
}

/** sessionStorage-backed store (cleared when the tab closes). */
export function sessionStorageStore(): ConnectStore {
  return {
    get: (k) => window.sessionStorage.getItem(k),
    set: (k, v) => window.sessionStorage.setItem(k, v),
    remove: (k) => window.sessionStorage.removeItem(k),
  };
}

export function createBrowserConnect(config: ConnectSessionConfig): BrowserConnect {
  const client = new NosanaConnectClient(config);
  const store = config.store ?? sessionStorageStore();
  const session = createConnectSession(client, store, {
    redirectUri: config.redirectUri,
    // The default sessionStorage store is per-tab and sole-owned, so cache.
    cacheTokens: !config.store,
  });

  return {
    async loginWithRedirect(options) {
      window.location.assign(await session.start(options));
    },
    handleRedirectCallback: (url = window.location.href) => session.complete(url),
    isAuthenticated: session.isAuthenticated,
    getAccessToken: session.getAccessToken,
    async getIdTokenClaims() {
      const tokens = await session.readStoredTokens();
      return tokens?.id_token ? decodeJwtPayload(tokens.id_token) : null;
    },
    async getUser() {
      const tokens = await session.readStoredTokens();
      if (tokens?.id_token) {
        const claims = decodeJwtPayload(tokens.id_token);
        if (claims) return claims;
      }
      return tokens ? client.userInfo(tokens.access_token) : null;
    },
    logout: session.logout,
  };
}

/** Decode a JWT payload without verifying its signature (display only). */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const segment = jwt.split('.')[1];
  if (!segment) return null;
  try {
    const b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
