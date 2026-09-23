# @nosana/connect

OAuth 2.1 / OIDC client for **"Connect with Nosana"**. It lets your app sign users
in with their Nosana account and call the Nosana API on their behalf — without ever
handling a pasted API key.

The library does the OAuth ceremony for you: it generates PKCE, manages CSRF `state`,
exchanges the authorization code, and transparently refreshes access tokens. The PKCE
verifier is generated and stored **inside the client** and never transmitted, so the
security guarantee holds and your app never touches a `code_challenge`.

- **Isomorphic core** — works in browsers and Node 20+ (uses Web Crypto + `fetch`).
- **`@nosana/connect/browser`** — drop-in SPA redirect flow with token management.

## Install

```bash
pnpm add @nosana/connect
```

## Get a client ID

Register your app under **Account → Connected Apps** in the Nosana dashboard. You'll get
a `client_id` (`stcl_…`). Add your redirect URI(s) there — the authorization server only
returns the code to URIs registered for your app.

- **Browser / SPA app** → leave it a **public** app (PKCE, no secret).
- **App with a backend that can keep a secret** → mark it **server-side** (confidential);
  it gets a client secret and skips PKCE.

## Quick start (browser SPA)

```ts
import { createBrowserConnect } from "@nosana/connect/browser";

const connect = createBrowserConnect({
  clientId: "stcl_…",
  redirectUri: location.origin + "/callback",
  // issuer defaults to Nosana production; pass `issuer` to target devnet
});

// On your "Connect with Nosana" button:
await connect.loginWithRedirect({ appState: { returnTo: location.pathname } });

// On your /callback route:
const { appState } = await connect.handleRedirectCallback();
// → user is signed in; go back to where they started
location.assign(appState?.returnTo ?? "/");

// Anywhere you call the API:
const token = await connect.getAccessToken(); // valid token, auto-refreshed
await fetch("https://deploy.nosana.com/api/credits/balance", {
  headers: { Authorization: `Bearer ${token}` },
});
```

`loginWithRedirect` persists the PKCE verifier and `state` (in `sessionStorage` by
default), then redirects to Nosana. `handleRedirectCallback` verifies `state`, exchanges
the code for tokens, and stores them. `getAccessToken` returns a valid access token,
refreshing via the refresh token when it's near expiry.

## Use with `@nosana/kit`

`@nosana/kit` re-exports this package and can build the Connect session for you: pass a
`connect` config and `kit.api.*` calls carry the (auto-refreshed) token — no manual header
handling:

```ts
import { createNosanaClient, createBrowserConnect, NosanaNetwork } from "@nosana/kit";

// Build the session (keep the ref for login), pass it to the client.
const connect = createBrowserConnect({ clientId: "stcl_…", redirectUri: location.origin + "/callback" });
const client = createNosanaClient(NosanaNetwork.MAINNET, { connect });

// …connect.loginWithRedirect() / connect.handleRedirectCallback() as above…
await client.api.credits.balance(); // Authorization: Bearer <fresh token>
```

`connect` also accepts browser config to build for you (`{ connect: { clientId, redirectUri } }`),
or any session exposing `getAccessToken()`. The token is resolved on every request, so it
stays fresh — a static `api.apiKey` would go stale.

**Server-side web apps** (acting on behalf of a logged-in user) don't build a session here:
exchange the code with your client secret, then pass that user's token to the client with
`api: { getToken: () => usersAccessToken }`.

> This is the cross-origin path. A **first-party** app on a `*.nosana.com` domain can
> instead ride the existing session cookie with `api: { include_credentials: true }` and
> skip Connect entirely.

## Configuration

`ConnectConfig` (accepted by both `createBrowserConnect` and `NosanaConnectClient`):

| Field | Type | Notes |
| --- | --- | --- |
| `clientId` | `string` | **Required.** From the Connected Apps dashboard. |
| `redirectUri` | `string` | Callback URL; must match one registered for the app. |
| `clientSecret` | `string` | Confidential apps only. Presence disables PKCE and enables HTTP Basic on the token endpoint. **Never ship a secret in browser code.** |
| `scopes` | `string[]` | Defaults to `["openid", "offline_access"]`. |
| `issuer` | `string` | Authorization-server issuer. Defaults to `https://deploy.nosana.com/api/auth`. |
| `metadata` | `AuthorizationServerMetadata` | Pre-resolved endpoints; skips discovery. |
| `fetch` | `typeof fetch` | Custom fetch (tests / non-standard runtimes). |

`createBrowserConnect` additionally accepts `store` (a `ConnectStore`) to override where
PKCE state and tokens are kept; it defaults to `sessionStorage`.

## Browser API

`createBrowserConnect(config)` returns:

| Method | Description |
| --- | --- |
| `loginWithRedirect(options?)` | Generate PKCE + state, persist them, redirect to authorize. |
| `handleRedirectCallback(url?)` | Verify state, exchange the code, store tokens. Returns `{ appState, tokens }`. |
| `isAuthenticated()` | Whether a token set is stored. |
| `getAccessToken()` | A valid access token, refreshed when near expiry. |
| `getIdTokenClaims()` | Decoded `id_token` claims (unverified; display only). |
| `getUser()` | `id_token` claims, falling back to the OIDC userinfo endpoint. |
| `logout()` | Clear stored tokens locally. |

## Core API (any runtime)

For confidential/server use today, or to build your own flow, use the stateless client:

```ts
import { NosanaConnectClient } from "@nosana/connect";

const client = new NosanaConnectClient({
  clientId: "stcl_…",
  clientSecret: process.env.NOSANA_CLIENT_SECRET, // confidential
  redirectUri: "https://yourapp.com/auth/nosana/callback",
});

// 1. Send the user to authorize:
const { url, state } = await client.createAuthorizationRequest();
// store `state` (and `codeVerifier` for public clients) in the user's session, redirect to `url`

// 2. On your callback, after checking `state`:
const tokens = await client.exchangeCode({ code, /* codeVerifier for public clients */ });

// 3. Later:
const fresh = await client.refresh(tokens.refresh_token!);
const user = await client.userInfo(tokens.access_token);
```

`NosanaConnectClient` owns no storage and triggers no redirects — the `browser` (and,
soon, `server`) wrappers layer those on top.

## Environments

`issuer` defaults to Nosana production. For devnet, pass the devnet gateway host, e.g.:

```ts
createBrowserConnect({ clientId, redirectUri, issuer: "https://<devnet-gateway>/api/auth" });
```

The client discovers endpoints from `${issuer}/.well-known/openid-configuration`, with a
constructed-endpoint fallback if discovery is unavailable.

## License

MIT
