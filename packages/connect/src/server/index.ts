import { createConnectSession, memoryStore, NosanaConnectClient } from '../core/index.js';
import type { CallbackResult, ConnectSessionConfig, LoginOptions } from '../core/index.js';

/** Options for {@link ServerConnect.getLoginUrl}. */
export type ServerLoginOptions = LoginOptions;
export type { CallbackResult as ServerCallbackResult } from '../core/index.js';

export interface ServerConnect {
  /** Build the URL to redirect the user to, and remember the request. */
  getLoginUrl(options?: ServerLoginOptions): Promise<string>;
  /** Complete the sign-in from the callback URL: verify, exchange, store tokens. */
  handleCallback(url: string): Promise<CallbackResult>;
  isAuthenticated(): Promise<boolean>;
  /** A valid access token, transparently refreshed when near expiry. */
  getAccessToken(): Promise<string>;
  logout(): Promise<void>;
}

/**
 * Server-side "Connect with Nosana" session for a **confidential** app: the
 * sign-in runs on your backend and the code is exchanged with your client
 * secret (no PKCE). Requires a `clientSecret`.
 *
 * State and tokens are kept in a `store`. It defaults to in-memory, which suits
 * a single user; for a multi-user web server pass a `store` bound to the current
 * user's session so each user's sign-in is isolated.
 *
 * ```ts
 * import { createServerConnect } from '@nosana/connect/server';
 *
 * const connect = createServerConnect({
 *   clientId: 'stcl_…',
 *   clientSecret: process.env.NOSANA_CLIENT_SECRET,
 *   redirectUri: 'https://yourapp.com/callback',
 *   store: sessionStore, // per-user
 * });
 *
 * // /login route:    res.redirect(await connect.getLoginUrl());
 * // /callback route: await connect.handleCallback(req.url);
 * // then:            await connect.getAccessToken();
 * ```
 */
export function createServerConnect(config: ConnectSessionConfig): ServerConnect {
  if (!config.clientSecret) {
    throw new Error('NosanaConnect: server session requires a clientSecret');
  }
  const client = new NosanaConnectClient(config);
  const store = config.store ?? memoryStore();
  const session = createConnectSession(client, store, {
    redirectUri: config.redirectUri,
    // The default in-memory store is single-user and sole-owned, so cache; a
    // custom (possibly shared per-user) store is always read fresh.
    cacheTokens: !config.store,
  });

  return {
    getLoginUrl: session.start,
    handleCallback: session.complete,
    isAuthenticated: session.isAuthenticated,
    getAccessToken: session.getAccessToken,
    logout: session.logout,
  };
}
