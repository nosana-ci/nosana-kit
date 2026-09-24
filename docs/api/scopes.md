---
title: Permissions (Scopes)
---

# Permissions (Scopes)

Every API key, and every app you connect to your Nosana account, carries a set of
**permissions**, also called scopes. A request can only do what its permissions allow. A
key that can view your credits can't post a job or spend them.

When you sign in to [Nosana Deploy](https://deploy.nosana.com) yourself, you aren't
limited: your own session always has every permission.

## Available permissions

| Permission | Allows | API keys | Apps & MCP |
|---|---|:-:|:-:|
| `credits:read` | View your credit balance, transactions and spending history | ✓ | ✓ |
| `inference:use` | Run LLM inference (spends credits) | ✓ | — |
| `jobs:read` | Read the status, results and endpoints of jobs you've run | ✓ | ✓ |
| `jobs:write` | Create, extend and stop jobs (spends credits) | ✓ | ✓ |
| `deployments:read` | View your deployments | ✓ | ✓ |
| `deployments:write` | Create, update and delete your deployments (spends credits) | ✓ | ✓ |
| `wallet:sign` | Sign messages with your Nosana wallet key | ✓ | ✓ |
| `api-keys:manage` | Create, view and revoke your API keys | ✓ | — |
| `oauth-apps:manage` | Manage the OAuth apps you own | ✓ | — |

Three permissions are for API keys only:

- `inference:use`: the [inference endpoints](/api/llm) only accept API keys.
- `api-keys:manage` and `oauth-apps:manage`: an app that could create API keys could keep
  access to your account after you disconnect it.

:::warning
`wallet:sign` lets its holder sign messages as your wallet. The SDK uses it to reach
your running jobs directly on their node, and that includes stopping them (see
[Manage an Active Job](/api/jobs#manage-an-active-job)). Only grant it to keys and apps you
trust with that. To read job data without it, use `jobs:read`
([Read Job Data](/api/jobs#read-job-data)).
:::

To build a permission picker of your own, fetch the current list from
`GET https://api.nosana.com/auth/scopes`. No key is needed.
Each entry's `oauthGrantable` flag tells you whether apps can use it.

## API keys

Choose a key's permissions when you create it:

- In the dashboard, tick **Read** and **Write** for each resource in the **Create API Key**
  dialog (see [Get API Key](/api/get-api-key)).
- With the SDK or over HTTP, pass a `scopes` array:

:::tabs

== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const created = await client.api.user.apiKeys.create({
  name: 'read-only-monitoring',
  scopes: ['credits:read', 'jobs:read', 'deployments:read'],
});
console.log('New key:', created.key);
```

== HTTP API

```bash
curl -X POST https://api.nosana.com/api-keys/ \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "read-only-monitoring",
    "scopes": ["credits:read", "jobs:read", "deployments:read"]
  }'
```

:::

Good to know:

- **No `scopes` means everything you have.** A key created without `scopes` gets every
  permission of whoever creates it.
- **A key restricted to LLM models** (`llmModels`) gets only `inference:use` by default.
- **A key can't hand out more than it has.** A key with `api-keys:manage` can only create
  keys with permissions it holds itself (`403` otherwise). An unknown scope name is a `400`.
- **Permissions can't be changed later.** To change them, create a new key and revoke the
  old one.
- **Keys created before permissions existed** have full access.

To see what a key can do, call `client.api.auth.validateApiKey(key)`
(`POST /auth/validate-api-key`). Its response includes the key's `scopes`.

## Apps and MCP

Apps that use [Connect with Nosana](/connect/), and AI assistants connected to the
[MCP server](/mcp/intro), act on your behalf with an access token. That token carries
only the permissions you approved:

1. When an app is registered (**Account → Connected Apps**), its owner chooses the most it
   can ever ask for.
2. When someone signs in, the app asks for some or all of those permissions. By default the
   Connect SDK asks for everything the app was registered with. Pass `scopes` to ask for
   less (see [Choose what your app can do](/connect/#choose-what-your-app-can-do)).
3. The consent screen lists what the app is asking for. The user approves or declines the
   whole request.

## When a permission is missing

A request without the permission it needs is rejected with `403 Forbidden`:

```json
{
  "message": "Insufficient scope. This endpoint requires: jobs:write.",
  "code": "INSUFFICIENT_SCOPE"
}
```

The `WWW-Authenticate` header names the missing permission in a machine-readable form:

```
WWW-Authenticate: Bearer error="insufficient_scope", scope="jobs:write"
```

To fix it, create a key that includes the permission, or sign in to the app again and
approve the permission it asks for.
