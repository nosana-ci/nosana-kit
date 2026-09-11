---
title: Raw Clients
---

# Raw Clients

The curated route groups cover the consumer- and node-facing endpoints. Any
endpoint that doesn't have a curated method (for example admin or ops routes)
is still reachable through the underlying, fully-typed
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) clients at
`client.api.clients`. Authentication is applied automatically — you don't add
headers yourself.

```ts twoslash
declare const process: { env: Record<string, string> };
declare const nodeAddress: string;
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// every route of each service, typed against its OpenAPI schema:
client.api.clients.clientManager;
client.api.clients.hostManager;
client.api.clients.blockchainIndexer;
client.api.clients.deploymentManager;

// e.g. call a route not exposed as a curated method:
const { data, error } = await client.api.clients.hostManager.GET(
  '/nodes/{id}/full',
  { params: { path: { id: nodeAddress } } },
);
```

Path, params and response are all type-checked against the generated OpenAPI
schema, so your editor autocompletes routes and payloads.

## Services

| Client | Serves | Base URL (mainnet) |
|---|---|---|
| `clients.clientManager` | Auth, API keys, credits, payments, templates, job writes | `https://client-manager.k8s.prd.nosana.com` |
| `clients.blockchainIndexer` | Job & stats reads | `https://blockchain-indexer.k8s.prd.nos.ci` |
| `clients.deploymentManager` | Deployments & vaults | `https://deployment-manager.k8s.prd.nos.ci` |
| `clients.hostManager` | Markets, nodes, benchmarks | `https://host-manager.k8s.prd.nosana.com` |

All four services are also reachable through a single proxy at
`https://api.nosana.com`.

The full mapping of every production endpoint to its SDK method (and which
endpoints are raw-client-only) is maintained in
[`packages/api/API_ENDPOINTS.md`](https://github.com/nosana-ci/nosana-kit/blob/main/packages/api/API_ENDPOINTS.md).
