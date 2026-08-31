import type { AuthorizationServerMetadata } from './types.js';

/** Default Nosana production issuer. Override via ConnectConfig.issuer
 *  (e.g. the devnet gateway host during development). */
export const DEFAULT_ISSUER = 'https://deploy.nosana.com/api/auth';

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

/** Fetch the OIDC discovery document for an issuer, falling back to constructed
 *  endpoints when it is missing or malformed. */
export async function discover(
  issuer: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AuthorizationServerMetadata> {
  const base = issuer.replace(/\/+$/, '');
  try {
    const res = await fetchImpl(`${base}/.well-known/openid-configuration`);
    if (!res.ok) return defaultEndpoints(base);
    const doc = (await res.json()) as Partial<AuthorizationServerMetadata>;
    if (!doc.authorization_endpoint || !doc.token_endpoint) return defaultEndpoints(base);
    return {
      issuer: doc.issuer ?? base,
      authorization_endpoint: doc.authorization_endpoint,
      token_endpoint: doc.token_endpoint,
      userinfo_endpoint: doc.userinfo_endpoint,
      jwks_uri: doc.jwks_uri,
      end_session_endpoint: doc.end_session_endpoint,
    };
  } catch {
    return defaultEndpoints(base);
  }
}
