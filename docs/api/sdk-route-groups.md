---
title: SDK Route Groups
---

# SDK Route Groups

The `@nosana/kit` SDK exposes the Nosana API as typed route groups under
`client.api`. Each group bundles the endpoints for one area of the platform.
Every group is wired into the client automatically:

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: { apiKey: process.env.NOSANA_API_KEY },
});

const balance = await client.api.credits.balance();
const markets = await client.api.markets.list();
```

> Looking for the raw endpoint list? See
> [`packages/api/API_ENDPOINTS.md`](https://github.com/nosana-ci/nosana-kit/blob/main/packages/api/API_ENDPOINTS.md)
> for the full mapping of every prd endpoint to its SDK method.

## `auth`

| Method | Description |
|---|---|
| `auth.validateSession()` | Validate a SuperTokens session |
| `auth.validateApiKey()` | Validate an API key |
| `auth.signMessage()` | Sign a message for external-service auth |

## `user` — API keys

| Method | Description |
|---|---|
| `user.apiKeys.create(request)` | Create an API key |
| `user.apiKeys.list()` | List your API keys |
| `user.apiKeys.get(id)` | Get an API key |
| `user.apiKeys.update(id, request)` | Update an API key |
| `user.apiKeys.delete(id)` | Delete an API key |

## `jobs`

Reads come from the Blockchain Indexer; credit-based writes from the Client Manager.

| Method | Description |
|---|---|
| `jobs.get(address)` | Get a job by address |
| `jobs.getAll(query?)` | List/filter jobs |
| `jobs.getBatch(request)` | Get many jobs by address (≤100) |
| `jobs.getRunning()` | Running jobs count per market |
| `jobs.getRunningNodes(query)` | Running nodes for a market |
| `jobs.getLongRunning(query?)` | Long-running jobs |
| `jobs.getStats(query?)` | Aggregated job statistics |
| `jobs.getStatsTimestamps(query?)` | Job timestamps |
| `jobs.getStatsTimestampsHours(query?)` | GPU compute hours over time |
| `jobs.getCount(query?)` | Count jobs by state |
| `jobs.list(request, options?)` | Create a job with credits |
| `jobs.extend(request, options?)` | Extend a job with credits |
| `jobs.stop(address, options?)` | Stop a job (refund remaining credits) |
| `jobs.listBatch(request, options)` | Bulk-create jobs |
| `jobs.extendBatch(request, options)` | Bulk-extend jobs |
| `jobs.stopBatch(request, options)` | Bulk-stop jobs |

The write methods accept an optional `idempotencyKey` (required for the batch
variants). Use `generateIdempotencyKey()` to safely retry a request:

```ts
import { generateIdempotencyKey } from '@nosana/kit';

const key = generateIdempotencyKey();
await client.api.jobs.list(request, { idempotencyKey: key });
```

## `credits`

| Method | Description |
|---|---|
| `credits.balance()` | Get credit balance |
| `credits.claim(code)` | Claim a credit code |
| `credits.request()` | Request free credits |
| `credits.checkEligibility()` | Check free-credit eligibility |
| `credits.getSpendingHistory(request)` | Credit spending history |
| `credits.getTransactions(request)` | List credit transactions |
| `credits.invitations.get(token)` | Get invitation details |
| `credits.invitations.claim(token)` | Claim an invitation |

## `markets`

| Method | Description |
|---|---|
| `markets.list()` | List markets |
| `markets.get(id)` | Get a market |
| `markets.getRequiredResources(id)` | Required resources for a market |
| `markets.getPrices()` | All market prices |
| `markets.getPrice()` | Current NOS price (USD) |
| `markets.getDockerImages()` | List Docker images |
| `markets.getDockerImage(id)` | Get a Docker image |
| `markets.getRemoteResources()` | List remote resources |
| `markets.getRemoteResource(id)` | Get a remote resource |

## `deployments`

See [Create Deployments](/api/create-deployments) and
[Manage Deployments](/api/manage-deployments) for full guides. Methods:
`create`, `get`, `list`, `pipe`, and per-deployment `start`, `stop`, `archive`,
`delete`, `getTasks`, `getJob`, `getJobs`, `getRevisions`, `getEvents`,
`generateAuthHeader`, `createRevision`, `updateReplicaCount`,
`updateActiveRevision`, `updateTimeout`, `updateSchedule`, `updateName`, plus
`getJobDefinition` / `submitJobResults` (node-facing) and `vaults`.

## `templates`

| Method | Description |
|---|---|
| `templates.list()` | List templates |
| `templates.getAllGrouped()` | Templates grouped by category |
| `templates.get(id)` | Get a template |
| `templates.getVariant(id, variantId)` | Get a template variant |

## `hosts` — nodes & GPU hosts

| Method | Description |
|---|---|
| `hosts.list(query?)` | List nodes |
| `hosts.get(id)` | Get a node |
| `hosts.getFull(id)` / `getInfo(id)` | Full / extended node info |
| `hosts.getMetrics(id, query?)` | Node metrics |
| `hosts.getRewardsById(id)` / `getRewards()` | Node / global rewards |
| `hosts.getRecentBenchmarks(id)` | Recent node benchmarks |
| `hosts.getAvailableGpus()` | Available GPUs |
| `hosts.getQueuedNodes(query?)` | Queued nodes |
| `hosts.getUptime(node, query?)` | Node uptime |
| `hosts.getByCountry()` | Node distribution by country |
| `hosts.getWithAccess(query?)` | Nodes with market access |
| `hosts.getRequestMarket(query?)` / `getMarketRelation(query?)` | Market assignment helpers |
| `hosts.getMinimumRequiredVersion(query?)` | Minimum node version |
| `hosts.register` / `syncNode` / `heartbeat` / `payment` | Node-operator self-service |
| `hosts.postMetrics(id, body)` / `updateAddress(id, body)` / `updateContact(id, body)` | Node-operator updates |

## `stats`

| Method | Description |
|---|---|
| `stats.get()` | Latest aggregated statistics |
| `stats.getPrice(query?)` | NOS token price |
| `stats.getSpendingHistory(request)` | Spending history |
| `stats.getEarningHistory(request)` | Node earnings history |

## `payments`

| Method | Description |
|---|---|
| `payments.listMethods()` | List payment methods |
| `payments.addMethod(request)` | Add a payment method (setup intent) |
| `payments.setDefaultMethod(id)` | Set the default payment method |
| `payments.deleteMethod(id)` | Delete a payment method |
| `payments.createPaymentIntent(request)` | Create a PaymentIntent |
| `payments.listPurchases()` | List credit purchases |

## `benchmarks`

| Method | Description |
|---|---|
| `benchmarks.getRecent()` | Recent benchmarks |
| `benchmarks.getMarketMetricAggregates(query?)` | Per-market metric aggregates |
| `benchmarks.getVersion()` | Current benchmark version |
| `benchmarks.getThresholds(query?)` / `getMarketThresholds(query?)` | Thresholds |
| `benchmarks.getMetrics(query?)` / `getOperations()` / `getMetricProcessors()` | Metric/operation definitions |
| `benchmarks.getTemplatesConfig()` / `getTemplatesRefresh()` | Benchmark template config |
| `benchmarks.getPrediction(id, body)` | Benchmark prediction |
| `benchmarks.submitResults(id, body)` / `seed(id, body)` | Node benchmark submission |

## `newsletter`

| Method | Description |
|---|---|
| `newsletter.subscribe(request)` | Subscribe an email to the newsletter |

## Raw clients — `api.clients`

Any endpoint that doesn't have a curated method (for example admin or ops
routes) is still reachable through the underlying, fully-typed `openapi-fetch`
clients. Authentication is applied automatically — you don't add headers
yourself.

```ts
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

Path, params and response are all type-checked against the generated schema.
