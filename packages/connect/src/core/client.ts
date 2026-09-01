import { DEFAULT_ISSUER, discover } from './discovery.js';
import { codeChallengeS256, generateCodeVerifier, randomString } from './pkce.js';
import type {
  AuthorizationRequest,
  AuthorizationServerMetadata,
  ConnectConfig,
  CreateAuthorizationOptions,
  ExchangeCodeParams,
  TokenResponse,
} from './types.js';

const DEFAULT_SCOPES = ['openid', 'offline_access'];

/**
 * Stateless OAuth 2.1 / OIDC client. Environment-agnostic: it constructs
 * authorize URLs and performs token requests, but owns no storage and triggers
 * no redirects — the browser wrapper (`createBrowserConnect`) layers those on top.
 */
export class NosanaConnectClient {
  private readonly config: ConnectConfig;
  private readonly fetchImpl: typeof fetch;
  private metadataPromise?: Promise<AuthorizationServerMetadata>;

  constructor(config: ConnectConfig) {
    if (!config.clientId) throw new Error('NosanaConnect: clientId is required');
    this.config = config;
    this.fetchImpl = config.fetch ?? fetch;
  }

  /** Resolve (and cache) the authorization-server metadata. */
  metadata(): Promise<AuthorizationServerMetadata> {
    if (this.config.metadata) return Promise.resolve(this.config.metadata);
    if (!this.metadataPromise) {
      this.metadataPromise = discover(this.config.issuer ?? DEFAULT_ISSUER, this.fetchImpl);
    }
    return this.metadataPromise;
  }

  /** Build an authorize URL plus the state (+ PKCE verifier) to keep for the callback. */
  async createAuthorizationRequest(
    options: CreateAuthorizationOptions = {},
  ): Promise<AuthorizationRequest> {
    const meta = await this.metadata();
    const scope = this.scopeString(options.scopes);
    const state = randomString(16);
    const usePkce = options.pkce ?? !this.config.clientSecret;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.redirectUri(options.redirectUri),
      scope,
      state,
    });

    let codeVerifier: string | undefined;
    if (usePkce) {
      codeVerifier = generateCodeVerifier();
      params.set('code_challenge', await codeChallengeS256(codeVerifier));
      params.set('code_challenge_method', 'S256');
    }

    let nonce: string | undefined;
    if (scope.split(' ').includes('openid')) {
      nonce = randomString(16);
      params.set('nonce', nonce);
    }

    for (const [key, value] of Object.entries(options.extraParams ?? {})) {
      params.set(key, value);
    }

    return {
      url: `${meta.authorization_endpoint}?${params.toString()}`,
      state,
      codeVerifier,
      nonce,
    };
  }

  /** Exchange an authorization code for tokens. */
  async exchangeCode(params: ExchangeCodeParams): Promise<TokenResponse> {
    const meta = await this.metadata();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: this.redirectUri(params.redirectUri),
      client_id: this.config.clientId,
    });
    if (params.codeVerifier) body.set('code_verifier', params.codeVerifier);
    return this.tokenRequest(meta.token_endpoint, body);
  }

  /** Exchange a refresh token for a fresh token set. */
  async refresh(refreshToken: string): Promise<TokenResponse> {
    const meta = await this.metadata();
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.config.clientId,
    });
    return this.tokenRequest(meta.token_endpoint, body);
  }

  /** OIDC userinfo for an access token. */
  async userInfo(accessToken: string): Promise<Record<string, unknown>> {
    const meta = await this.metadata();
    if (!meta.userinfo_endpoint) throw new Error('NosanaConnect: issuer exposes no userinfo endpoint');
    const res = await this.fetchImpl(meta.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw await requestError(res);
    return (await res.json()) as Record<string, unknown>;
  }

  private redirectUri(override?: string): string {
    const uri = override ?? this.config.redirectUri;
    if (!uri) throw new Error('NosanaConnect: redirectUri is required');
    return uri;
  }

  private scopeString(override?: string[]): string {
    return (override ?? this.config.scopes ?? DEFAULT_SCOPES).join(' ');
  }

  private async tokenRequest(endpoint: string, body: URLSearchParams): Promise<TokenResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    };
    // Confidential clients authenticate with HTTP Basic (client_secret_basic).
    if (this.config.clientSecret) {
      headers.Authorization = `Basic ${basicAuth(this.config.clientId, this.config.clientSecret)}`;
    }
    const res = await this.fetchImpl(endpoint, {
      method: 'POST',
      headers,
      body: body.toString(),
    });
    if (!res.ok) throw await requestError(res);
    return (await res.json()) as TokenResponse;
  }
}

/** client_secret_basic credentials (RFC 6749 §2.3.1). */
function basicAuth(id: string, secret: string): string {
  return btoa(`${encodeURIComponent(id)}:${encodeURIComponent(secret)}`);
}

async function requestError(res: Response): Promise<Error> {
  let detail = '';
  try {
    detail = await res.text();
  } catch {
    /* ignore body read failures */
  }
  return new Error(`NosanaConnect: request failed (${res.status})${detail ? `: ${detail}` : ''}`);
}
