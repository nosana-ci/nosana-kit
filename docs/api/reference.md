---
title: API Reference
---

# API Reference

The `@nosana/kit` SDK exposes the Nosana API as typed route groups under
`client.api`. Each group bundles the endpoints for one area of the platform,
and every group is wired into the client automatically:

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

const balance = await client.api.credits.balance();
const markets = await client.api.markets.list();
```

## Route Groups

| Group | Description |
|---|---|
| [`auth` / `user`](/api/auth) | Session & API-key validation, API-key management |
| [`deployments`](/api/create-deployments) | Full deployment lifecycle — see [Create](/api/create-deployments), [Manage](/api/manage-deployments), and [Vaults](/api/vault-management) |
| [`jobs`](/api/jobs) | Post, extend, stop, and query jobs (single & batch) |
| [`markets`](/api/markets) | GPU markets, pricing, Docker images, remote resources |
| [`credits`](/api/credits) | Credit balance, claiming, spending history |
| [`templates`](/api/templates) | Deployment templates catalog |
| [`hosts`](/api/hosts) | Nodes & GPU hosts — discovery, metrics, rewards, node-operator routes |
| [`stats`](/api/stats) | Network statistics, NOS price, earning/spending history |
| [`payments`](/api/payments) | Payment methods and credit purchases (Stripe) |
| [`benchmarks`](/api/benchmarks) | Benchmark data, thresholds, and node benchmark submission |
| [Raw clients](/api/raw-clients) | Typed `openapi-fetch` clients for every other endpoint |

Every reference page lists the SDK method next to the HTTP method and path it
calls, so the same pages work as an HTTP API reference. For the raw
endpoint-to-method mapping of all services in one file, see
[`packages/api/API_ENDPOINTS.md`](https://github.com/nosana-ci/nosana-kit/blob/main/packages/api/API_ENDPOINTS.md).

## Backend services

The SDK talks to four Nosana services directly. Each route group is served by
one (or two) of them:

| Service | Serves | Base URL (mainnet) |
|---|---|---|
| Client Manager | `auth`, `user`, `credits`, `payments`, `templates`, job writes | `https://client-manager.k8s.prd.nosana.com` |
| Blockchain Indexer | `jobs` (reads), `stats` | `https://blockchain-indexer.k8s.prd.nos.ci` |
| Deployment Manager | `deployments` | `https://deployment-manager.k8s.prd.nos.ci` |
| Host Manager | `markets`, `hosts`, `benchmarks` | `https://host-manager.k8s.prd.nosana.com` |

You never need these URLs when using the SDK — they are resolved from the
network configuration. They matter when calling the HTTP API directly.
