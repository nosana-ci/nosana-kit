import type { AuthorizationServerMetadata } from './types.js';

/** Default Nosana production issuer. Override via ConnectConfig.issuer
 *  (e.g. the devnet host during development). */
export const DEFAULT_ISSUER = 'https://dashboard.k8s.prd.nosana.com/api/auth';

/** Nosana Connect issuer per network — the **dashboard API host** (`<host>/api/auth`,
 *  which proxies to client-manager). This is the same host the dashboard frontend
 *  already uses for its own SuperTokens calls, so the OAuth flow (and its CSRF
 *  cookie) stays on one host through login and consent with no dashboard change.
 *  (Regular API calls go via the same proxy but use a bearer token, not cookies,
 *  so the host doesn't matter there.) Keyed by the `@nosana/types` NosanaNetwork
 *  string values (kept as plain strings so this package stays dependency-free). */
export const NOSANA_ISSUERS: Record<string, string> = {
  mainnet: DEFAULT_ISSUER,
  devnet: 'https://dashboard.k8s.dev.nosana.com/api/auth',
};

/** The Connect issuer for a network, or undefined for an unknown one. */
export function issuerForNetwork(network: string): string | undefined {
  return NOSANA_ISSUERS[network];
}

/** Construct the SuperTokens OAuth2Provider endpoints from an issuer. Used as a
 *  fallback when the OIDC discovery document is unavailable. */
export function defaultEndpoints(issuer: string): AuthorizationServerMetadata {
  const base = issuer.replace(/\/+$/, '');
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/auth`,
    token_endpoint: `${base}/oauth/token`,
    userinfo_endpoint: `${base}/oauth/userinfo`,
    jwks_uri: `${base}/jwt/jwks.json`,
    end_session_endpoint: `${base}/oauth/logout`,
  };
}

// A resolved discovery document is stable for an issuer, so cache it for the
// process lifetime — otherwise the per-request server session pattern re-fetches
// it on every sign-in and refresh. Only successful discoveries with the default
// fetch are cached: a custom fetch (tests) bypasses it, and a fallback from a
// transient failure is never cached so it can be retried.
const discoveryCache = new Map<string, AuthorizationServerMetadata>();

/** Fetch the OIDC discovery document for an issuer, falling back to constructed
 *  endpoints when it is missing or malformed. */
export async function discover(
  issuer: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthorizationServerMetadata> {
  const base = issuer.replace(/\/+$/, '');
  const cacheable = fetchImpl === fetch;
  if (cacheable) {
    const cached = discoveryCache.get(base);
    if (cached) return cached;
  }
  try {
    const res = await fetchImpl(`${base}/.well-known/openid-configuration`);
    if (!res.ok) return defaultEndpoints(base);
    const doc = (await res.json()) as Partial<AuthorizationServerMetadata>;
    if (!doc.authorization_endpoint || !doc.token_endpoint) return defaultEndpoints(base);
    const metadata: AuthorizationServerMetadata = {
      issuer: doc.issuer ?? base,
      authorization_endpoint: doc.authorization_endpoint,
      token_endpoint: doc.token_endpoint,
      userinfo_endpoint: doc.userinfo_endpoint,
      jwks_uri: doc.jwks_uri,
      end_session_endpoint: doc.end_session_endpoint,
    };
    if (cacheable) discoveryCache.set(base, metadata);
    return metadata;
  } catch {
    return defaultEndpoints(base);
  }
}
