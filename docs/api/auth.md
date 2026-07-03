---
title: Authentication & API Keys
---

# Authentication & API Keys

Two route groups cover authentication: `auth` validates credentials and signs
messages, and `user.apiKeys` manages your API keys programmatically. Both are
served by the Client Manager.

For how to obtain an API key in the dashboard, see the
[Get API Key guide](/api/get-api-key). For wallet-based authentication, see
[Wallet Authentication](/api/wallet-authentication).

## `auth`

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// Validate an API key
const result = await client.api.auth.validateApiKey('nos_xxx_your_api_key');

// Validate a SuperTokens session (optionally pass the cookie header)
const session = await client.api.auth.validateSession();

// Sign a message for external-service authentication
const signature = await client.api.auth.signMessage('message-to-sign', {
  includeTime: true, // optional: include a timestamp in the signed payload
});
```

| Method | HTTP | Path | Description |
|---|---|---|---|
| `auth.validateApiKey(apiKey)` | POST | `/auth/validate-api-key` | Validate an API key |
| `auth.validateSession(cookieHeader?)` | POST | `/auth/validate-session` | Validate a SuperTokens session |
| `auth.signMessage(message, options?)` | POST | `/auth/sign-message/external` | Sign a message for external-service auth |

## `user.apiKeys`

Create, list, update, and delete API keys:

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// Create a key — the plaintext key is only returned once, store it safely
const created = await client.api.user.apiKeys.create({
  name: 'ci-pipeline',
});
console.log('New key:', created.key);

// List your keys
const { keys, total } = await client.api.user.apiKeys.list();

// Get, update, delete by id
const key = await client.api.user.apiKeys.get(keys[0].id);
await client.api.user.apiKeys.update(key.id, { name: 'renamed-key' });
await client.api.user.apiKeys.delete(key.id);
```

| Method | HTTP | Path | Description |
|---|---|---|---|
| `user.apiKeys.create(request)` | POST | `/api-keys/` | Create an API key |
| `user.apiKeys.list()` | GET | `/api-keys/` | List your API keys |
| `user.apiKeys.get(id)` | GET | `/api-keys/{id}` | Get an API key |
| `user.apiKeys.update(id, request)` | POST | `/api-keys/{id}/update` | Update an API key |
| `user.apiKeys.delete(id)` | POST | `/api-keys/{id}/delete` | Delete an API key |
