import { NosanaConnectClient } from '../core/index.js';
import type { ConnectConfig, ConnectStore, TokenResponse } from '../core/index.js';

const PENDING_KEY = 'nosana-connect:pending';
const TOKENS_KEY = 'nosana-connect:tokens';
/** Refresh a little before actual expiry to avoid racing the clock. */
const EXPIRY_SKEW_MS = 30_000;

interface PendingAuth {
  state: string;
  codeVerifier?: string;
  nonce?: string;
  redirectUri: string;
  appState?: unknown;
}

interface StoredTokens {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  /** Epoch ms at which the access token expires. */
  expiresAt?: number;
}

export interface LoginRedirectOptions {
  redirectUri?: string;
  scopes?: string[];
  /** Arbitrary state restored on the callback (e.g. the path to return to). */
  appState?: unknown;
  extraParams?: Record<string, string>;
}

export interface CallbackResult {
  appState?: unknown;
  tokens: TokenResponse;
}

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

export function createBrowserConnect(
  config: ConnectConfig & { store?: ConnectStore },
): BrowserConnect {
  const client = new NosanaConnectClient(config);
  const store: ConnectStore = config.store ?? sessionStorageStore();

  async function readTokens(): Promise<StoredTokens | null> {
    const raw = await store.get(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  }

  async function writeTokens(t: TokenResponse): Promise<void> {
    const stored: StoredTokens = {
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      id_token: t.id_token,
      scope: t.scope,
      expiresAt: t.expires_in ? Date.now() + t.expires_in * 1000 : undefined,
    };
    await store.set(TOKENS_KEY, JSON.stringify(stored));
  }

  async function loginWithRedirect(options: LoginRedirectOptions = {}): Promise<void> {
    const req = await client.createAuthorizationRequest({
      redirectUri: options.redirectUri,
      scopes: options.scopes,
      extraParams: options.extraParams,
    });
    const pending: PendingAuth = {
      state: req.state,
      codeVerifier: req.codeVerifier,
      nonce: req.nonce,
      redirectUri: options.redirectUri ?? config.redirectUri ?? window.location.origin,
      appState: options.appState,
    };
    await store.set(PENDING_KEY, JSON.stringify(pending));
    window.location.assign(req.url);
  }

  async function handleRedirectCallback(
    url: string = window.location.href,
  ): Promise<CallbackResult> {
    const params = new URL(url).searchParams;

    const error = params.get('error');
    if (error) {
      const description = params.get('error_description');
      throw new Error(`NosanaConnect: ${error}${description ? `: ${description}` : ''}`);
    }

    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) throw new Error('NosanaConnect: missing code or state in callback');

    const raw = await store.get(PENDING_KEY);
    if (!raw) throw new Error('NosanaConnect: no pending authorization found');
    const pending = JSON.parse(raw) as PendingAuth;
    if (pending.state !== state) throw new Error('NosanaConnect: state mismatch');

    const tokens = await client.exchangeCode({
      code,
      codeVerifier: pending.codeVerifier,
      redirectUri: pending.redirectUri,
    });
    await writeTokens(tokens);
    await store.remove(PENDING_KEY);
    return { appState: pending.appState, tokens };
  }

  async function isAuthenticated(): Promise<boolean> {
    return (await readTokens()) !== null;
  }

  async function getAccessToken(): Promise<string> {
    const tokens = await readTokens();
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

  async function getIdTokenClaims(): Promise<Record<string, unknown> | null> {
    const tokens = await readTokens();
    return tokens?.id_token ? decodeJwtPayload(tokens.id_token) : null;
  }

  async function getUser(): Promise<Record<string, unknown> | null> {
    const claims = await getIdTokenClaims();
    if (claims) return claims;
    const tokens = await readTokens();
    return tokens ? client.userInfo(tokens.access_token) : null;
  }

  async function logout(): Promise<void> {
    await store.remove(TOKENS_KEY);
    await store.remove(PENDING_KEY);
  }

  return {
    loginWithRedirect,
    handleRedirectCallback,
    isAuthenticated,
    getAccessToken,
    getIdTokenClaims,
    getUser,
    logout,
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
