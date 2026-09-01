import { NosanaConnectClient } from './client.js';
import type { CallbackResult, ConnectSession, ConnectStore, LoginOptions, TokenResponse } from './types.js';

const PENDING_KEY = 'nosana-connect:pending';
const TOKENS_KEY = 'nosana-connect:tokens';
/** Refresh a little before actual expiry to avoid racing the clock. */
const EXPIRY_SKEW_MS = 30_000;

interface PendingAuth {
  state: string;
  redirectUri: string;
  codeVerifier?: string;
  nonce?: string;
  appState?: unknown;
}

/** Token set as persisted in the store. */
export interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  /** Epoch ms at which the access token expires. */
  expiresAt?: number;
}

/**
 * The stateful part of a Connect session, shared by the browser and server
 * flows: it persists the in-flight request and tokens in a `store`, verifies
 * `state`, exchanges the code, and refreshes the access token near expiry. The
 * flows differ only in how they trigger the redirect, which the wrappers own —
 * this core is environment-agnostic. PKCE vs. secret is handled inside
 * `NosanaConnectClient`, so the code below is identical for both.
 */
export interface ConnectSessionCore extends ConnectSession {
  /** Build the authorize URL and remember the request. */
  start(options?: LoginOptions): Promise<string>;
  /** Complete a callback URL: verify state, exchange the code, store tokens. */
  complete(url: string): Promise<CallbackResult>;
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string>;
  /** The stored token set, or null — for reading id_token claims. */
  readStoredTokens(): Promise<StoredTokens | null>;
  logout(): Promise<void>;
}

export function createConnectSession(
  client: NosanaConnectClient,
  store: ConnectStore,
  options: {
    redirectUri?: string;
    /**
     * Cache the parsed token set in memory so every `getAccessToken` doesn't
     * re-read and re-parse the store. Safe only when this session is the sole
     * writer of the store — enable it for the built-in default store, not for a
     * custom (potentially shared, multi-user) one, where a fresh read is needed.
     */
    cacheTokens?: boolean;
  } = {},
): ConnectSessionCore {
  const { redirectUri: defaultRedirectUri, cacheTokens = false } = options;
  // `undefined` = not loaded yet; `null` = loaded, no tokens.
  let cached: StoredTokens | null | undefined;

  async function readStoredTokens(): Promise<StoredTokens | null> {
    if (cacheTokens && cached !== undefined) return cached;
    const raw = await store.get(TOKENS_KEY);
    const tokens = raw ? (JSON.parse(raw) as StoredTokens) : null;
    if (cacheTokens) cached = tokens;
    return tokens;
  }

  async function writeTokens(t: TokenResponse): Promise<void> {
    const stored: StoredTokens = {
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      id_token: t.id_token,
      scope: t.scope,
      expiresAt: t.expires_in ? Date.now() + t.expires_in * 1000 : undefined,
    };
    if (cacheTokens) cached = stored;
    await store.set(TOKENS_KEY, JSON.stringify(stored));
  }

  async function start(options: LoginOptions = {}): Promise<string> {
    const req = await client.createAuthorizationRequest({
      redirectUri: options.redirectUri,
      scopes: options.scopes,
      extraParams: options.extraParams,
    });
    const pending: PendingAuth = {
      state: req.state,
      redirectUri: options.redirectUri ?? defaultRedirectUri ?? '',
      codeVerifier: req.codeVerifier,
      nonce: req.nonce,
      appState: options.appState,
    };
    await store.set(PENDING_KEY, JSON.stringify(pending));
    return req.url;
  }

  async function complete(url: string): Promise<CallbackResult> {
    // A base makes a relative callback URL (a server's req.url) parse; it is
    // ignored for the absolute URLs a browser passes.
    const params = new URL(url, 'http://localhost').searchParams;

    const error = params.get('error');
    if (error) {
      const description = params.get('error_description');
      throw new Error(`NosanaConnect: ${error}${description ? `: ${description}` : ''}`);
    }

    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) throw new Error('NosanaConnect: missing code or state in callback');

    const raw = await store.get(PENDING_KEY);
    if (!raw) throw new Error('NosanaConnect: no pending sign-in found');
    const pending = JSON.parse(raw) as PendingAuth;
    if (pending.state !== state) throw new Error('NosanaConnect: state mismatch');

    const tokens = await client.exchangeCode({
      code,
      codeVerifier: pending.codeVerifier,
      redirectUri: pending.redirectUri || undefined,
    });
    await Promise.all([writeTokens(tokens), store.remove(PENDING_KEY)]);
    return { appState: pending.appState, tokens };
  }

  async function isAuthenticated(): Promise<boolean> {
    return (await readStoredTokens()) !== null;
  }

  async function getAccessToken(): Promise<string> {
    const tokens = await readStoredTokens();
    if (!tokens) throw new Error('NosanaConnect: not authenticated');

    const stillValid = !tokens.expiresAt || tokens.expiresAt - Date.now() > EXPIRY_SKEW_MS;
    if (stillValid) return tokens.access_token;

    if (!tokens.refresh_token) {
      throw new Error('NosanaConnect: access token expired and no refresh token available');
    }
    const refreshed = await client.refresh(tokens.refresh_token);
    // Some servers omit a rotated refresh token; keep the existing one.
    if (!refreshed.refresh_token) refreshed.refresh_token = tokens.refresh_token;
    await writeTokens(refreshed);
    return refreshed.access_token;
  }

  async function logout(): Promise<void> {
    if (cacheTokens) cached = null;
    await Promise.all([store.remove(TOKENS_KEY), store.remove(PENDING_KEY)]);
  }

  return { start, complete, isAuthenticated, getAccessToken, readStoredTokens, logout };
}
