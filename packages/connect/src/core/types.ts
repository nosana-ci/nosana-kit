/** OAuth 2.1 / OIDC configuration for a Nosana Connect client. */
export interface ConnectConfig {
  /** Client ID from the Nosana "Connected Apps" dashboard (stcl_…). */
  clientId: string;
  /** Confidential apps only: the client secret. Public/PKCE apps omit this. */
  clientSecret?: string;
  /** Where the authorization server redirects back to after login. */
  redirectUri?: string;
  /** Requested scopes. Defaults to ["openid", "offline_access"]. */
  scopes?: string[];
  /** Authorization-server issuer, e.g. https://deploy.nosana.com/api/auth.
   *  Defaults to the Nosana production issuer. */
  issuer?: string;
  /** Pre-resolved server metadata; when provided, discovery is skipped. */
  metadata?: AuthorizationServerMetadata;
  /** Custom fetch (tests / non-standard runtimes). Defaults to globalThis.fetch. */
  fetch?: typeof fetch;
}

/** Subset of RFC 8414 / OIDC discovery metadata that this client uses. */
export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
  jwks_uri?: string;
  end_session_endpoint?: string;
}

/** Token endpoint response (RFC 6749 §5.1 + OIDC id_token). */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

/** The pieces produced when starting an authorization request. */
export interface AuthorizationRequest {
  /** Full authorize URL to send the user to. */
  url: string;
  /** CSRF state to verify on the callback. */
  state: string;
  /** PKCE verifier to keep until the token exchange (public clients only). */
  codeVerifier?: string;
  /** OIDC nonce, when an openid scope was requested. */
  nonce?: string;
}

export interface CreateAuthorizationOptions {
  /** Override the configured redirect URI for this request. */
  redirectUri?: string;
  /** Override scopes for this request. */
  scopes?: string[];
  /** Force PKCE on/off. Defaults to on for public clients, off for confidential. */
  pkce?: boolean;
  /** Extra authorize params (e.g. prompt, login_hint). */
  extraParams?: Record<string, string>;
}

export interface ExchangeCodeParams {
  code: string;
  /** The verifier kept from createAuthorizationRequest (public clients). */
  codeVerifier?: string;
  /** Override the redirect URI (must match the one used to obtain the code). */
  redirectUri?: string;
}

/** Minimal key/value store for PKCE state and token persistence. */
export interface ConnectStore {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

/** A Connect config plus an optional store — the input to a session factory. */
export type ConnectSessionConfig = ConnectConfig & { store?: ConnectStore };

/** Options for starting a login. */
export interface LoginOptions {
  /** Override the configured redirect URI for this request. */
  redirectUri?: string;
  /** Override scopes for this request. */
  scopes?: string[];
  /** Arbitrary state restored on the callback (e.g. the path to return to). */
  appState?: unknown;
  /** Extra authorize params (e.g. prompt, login_hint). */
  extraParams?: Record<string, string>;
}

/** The result of completing a login callback. */
export interface CallbackResult {
  appState?: unknown;
  tokens: TokenResponse;
}

/**
 * The minimal contract the SDK needs from a Connect session: a source of the
 * current access token. The browser session (`createBrowserConnect`) satisfies
 * it, as does any token source you provide, so either can drive an
 * `@nosana/kit` client's API auth.
 */
export interface ConnectSession {
  getAccessToken(): string | Promise<string>;
}
