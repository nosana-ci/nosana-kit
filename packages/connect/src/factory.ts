import { createBrowserConnect, type BrowserConnect } from './browser/index.js';
import { createServerConnect, type ServerConnect } from './server/index.js';
import type { ConnectSessionConfig } from './core/index.js';

/** Config accepted by {@link createConnect}: a Connect config plus an optional
 *  store. A `clientSecret` selects the server flow; omitting it selects browser. */
export type ConnectFactoryConfig = ConnectSessionConfig;

/**
 * Create a "Connect with Nosana" session, picking the flow from your config:
 * a **client secret** means a confidential **server** app (redirect handled by
 * your backend); no secret means a public **browser** app (PKCE, redirect in the
 * browser). The returned type reflects that choice, so you get the right methods.
 *
 * ```ts
 * // browser app (no secret) → BrowserConnect
 * const connect = createConnect({ clientId, redirectUri });
 * await connect.loginWithRedirect();
 *
 * // server app (with secret) → ServerConnect
 * const connect = createConnect({ clientId, redirectUri, clientSecret });
 * res.redirect(await connect.getLoginUrl());
 * ```
 *
 * Prefer the explicit `createBrowserConnect` / `createServerConnect` when you
 * already know which environment you're in.
 */
export function createConnect(config: ConnectFactoryConfig & { clientSecret: string }): ServerConnect;
export function createConnect(config: ConnectFactoryConfig & { clientSecret?: never }): BrowserConnect;
export function createConnect(config: ConnectFactoryConfig): BrowserConnect | ServerConnect;
export function createConnect(config: ConnectFactoryConfig): BrowserConnect | ServerConnect {
  return config.clientSecret ? createServerConnect(config) : createBrowserConnect(config);
}
