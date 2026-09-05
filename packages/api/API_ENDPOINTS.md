# API Endpoints

Complete reference for the `@nosana/api` SDK route groups and the prd service endpoints they map to. Generated from the live prd OpenAPI specs.

Every service is called **directly** (no dashboard proxy). The SDK exposes curated, ergonomic methods for the consumer- and node-facing routes (below), and the **raw typed clients** for everything else.

## Clients

| Client | Framework | Base URL (mainnet) | Swagger |
|---|---|---|---|
| **Blockchain Indexer** | Elysia | `https://blockchain-indexer.k8s.prd.nos.ci` | `/swagger/json` |
| **Client Manager** | Elysia | `https://client-manager.k8s.prd.nosana.com` | `/swagger/json` |
| **Deployment Manager** | Fastify | `https://deployment-manager.k8s.prd.nos.ci` | `/documentation/json` |
| **Host Manager** | Elysia | `https://host-manager.k8s.prd.nosana.com` | `/swagger/json` |

> Client Manager & Host Manager run on `*.nosana.com`; Blockchain Indexer & Deployment Manager on `*.nos.ci`. Dev uses the `.dev.` variants; localnet uses `localhost:{3002,3003,3001,3004}`.

## Raw typed clients (`api.clients`)

Any endpoint not wrapped by a curated method below is still reachable — fully typed — through the underlying per-service `openapi-fetch` clients, with auth applied automatically:

```ts
const api = createNosanaApi(network, auth);

api.clients.clientManager     // every Client Manager route
api.clients.hostManager       // every Host Manager route (incl. admin)
api.clients.blockchainIndexer // every Blockchain Indexer route
api.clients.deploymentManager // every Deployment Manager route

// e.g. an admin route not exposed as a curated method:
await api.clients.hostManager.POST('/nodes/ban', { body: { /* typed */ } });
```

Path, params and response are all type-checked against the generated schema.

---

## SDK Route Groups

All groups are wired into `createNosanaApi()`.

### `auth` — Authentication
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `auth.signMessage()` | POST | `/auth/sign-message/external` | Sign message for external service authentication |
| `auth.validateApiKey()` | POST | `/auth/validate-api-key` | Validate API key |
| `auth.validateSession()` | POST | `/auth/validate-session` | Validate session |

### `user` — API Keys
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `user.apiKeys.create()` | POST | `/api-keys/` | Create API Key |
| `user.apiKeys.delete()` | POST | `/api-keys/{id}/delete` | Delete API Key |
| `user.apiKeys.get()` | GET | `/api-keys/{id}` | Get API Key |
| `user.apiKeys.list()` | GET | `/api-keys/` | Get API Keys |
| `user.apiKeys.update()` | POST | `/api-keys/{id}/update` | Update API Key |

### `jobs` — Job Operations
**Client:** Blockchain Indexer (reads) + Client Manager (writes)

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `jobs.extend()` | POST | `/jobs/{address}/extend` | Extend a job using credits |
| `jobs.extendBatch()` | POST | `/jobs/extend/batch` | Bulk-extend jobs using credits |
| `jobs.get()` | GET | `/jobs/{address}` | Get job by address |
| `jobs.getAll()` | GET | `/jobs/` | List jobs |
| `jobs.getBatch()` | POST | `/jobs/batch` | Get jobs by addresses |
| `jobs.getCount()` | GET | `/jobs/count` | Count jobs |
| `jobs.getLongRunning()` | GET | `/jobs/long-running` | Get long-running jobs |
| `jobs.getRunning()` | GET | `/jobs/running` | Get running jobs count per market |
| `jobs.getRunningNodes()` | GET | `/jobs/running-nodes` | Get running nodes for a market |
| `jobs.getStats()` | GET | `/jobs/stats` | Get job statistics |
| `jobs.getStatsTimestamps()` | GET | `/jobs/stats/timestamps` | Get job timestamps |
| `jobs.getStatsTimestampsHours()` | GET | `/jobs/stats/timestamps-hours` | Get GPU compute hours over time |
| `jobs.list()` | POST | `/jobs/list` | Create a job using credits |
| `jobs.listBatch()` | POST | `/jobs/list/batch` | Bulk-create jobs using credits |
| `jobs.stop()` | POST | `/jobs/{address}/stop` | Stop a job paid with credits |
| `jobs.stopBatch()` | POST | `/jobs/stop/batch` | Bulk-stop jobs using credits |

### `credits` — Credit Balance & Management
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `credits.balance()` | GET | `/credits/balance` | Get credit balance |
| `credits.checkEligibility()` | GET | `/credits/request/eligibility` | Check credit request eligibility |
| `credits.claim()` | POST | `/credits/claim` | Claim a credit code |
| `credits.getSpendingHistory()` | GET | `/credits/spending-history` | Get credit spending history |
| `credits.getTransactions()` | GET | `/credits/transactions` | List credit transactions |
| `credits.invitations.claim()` | POST | `/credits/invitations/{token}/claim` | Claim a credit invitation |
| `credits.invitations.get()` | GET | `/credits/invitations/{token}` | Get invitation by token |
| `credits.request()` | POST | `/credits/request` | Request free credits |

### `markets` — GPU Markets & Pricing
**Client:** Host Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `markets.get()` | GET | `/markets/{id}` |  |
| `markets.getDockerImage()` | GET | `/markets/docker-images/{id}` |  |
| `markets.getDockerImages()` | GET | `/markets/docker-images` |  |
| `markets.getPrice()` | GET | `/markets/price` | Get current NOS token price in USD |
| `markets.getPrices()` | GET | `/markets/prices` |  |
| `markets.getRemoteResource()` | GET | `/markets/remote-resources/{id}` |  |
| `markets.getRemoteResources()` | GET | `/markets/remote-resources` |  |
| `markets.getRequiredResources()` | GET | `/markets/{id}/required-resources` |  |
| `markets.list()` | GET | `/markets/` |  |

### `deployments` — Deployment Lifecycle
**Client:** Deployment Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `deployments.create()` | POST | `/deployments/create` | Create a new deployment. |
| `deployments.get()` | GET | `/deployments/{deployment}` | Get a specific deployment by ID. |
| `deployments.getJobDefinition()` | GET | `/deployments/jobs/{job}/job-definition` | Returns the job definition for a job. |
| `deployments.list()` | GET | `/deployments` | List all user deployments. |
| `deployments.pipe().archive()` | POST | `/deployments/{deployment}/archive` | Archive a deployment |
| `deployments.pipe().createRevision()` | POST | `/deployments/{deployment}/create-revision` | Create a new deployment revision. |
| `deployments.pipe().delete()` | DELETE | `/deployments/{deployment}` | Delete a deployment permanently |
| `deployments.pipe().duplicate()` | POST | `/deployments/{deployment}/duplicate` | Duplicate a deployment into a new DRAFT (or autostarted) deployment. |
| `deployments.pipe().generateAuthHeader()` | GET | `/deployments/{deployment}/header` | Get header for a specific deployment. |
| `deployments.pipe().getEvents()` | GET | `/deployments/{deployment}/events` | Get events for a specific deployment. |
| `deployments.pipe().getJob()` | GET | `/deployments/{deployment}/jobs/{job}` | Get a specific deployment job by ID. |
| `deployments.pipe().getJobs()` | GET | `/deployments/{deployment}/jobs` | Get jobs for a specific deployment. |
| `deployments.pipe().getRevisions()` | GET | `/deployments/{deployment}/revisions` | Get revisions for a specific deployment. |
| `deployments.pipe().getTasks()` | GET | `/deployments/{deployment}/tasks` | Get scheduled tasks for a specific deployment. |
| `deployments.pipe().start()` | POST | `/deployments/{deployment}/start` | Start an existing deployment. |
| `deployments.pipe().stop()` | POST | `/deployments/{deployment}/stop` | Stop a deployment |
| `deployments.pipe().updateActiveRevision()` | PATCH | `/deployments/{deployment}/update-active-revision` | Update deployment active revision. |
| `deployments.pipe().updateMarket()` | PATCH | `/deployments/{deployment}/update-market` | Update the market of a deployment; running jobs are relisted on the new market. |
| `deployments.pipe().updateName()` | PATCH | `/deployments/{deployment}/update-name` | Update the name of a deployment |
| `deployments.pipe().updateReplicaCount()` | PATCH | `/deployments/{deployment}/update-replica-count` | Update the replica count of a deployment |
| `deployments.pipe().updateSchedule()` | PATCH | `/deployments/{deployment}/update-schedule` | Update deployment schedule. |
| `deployments.pipe().updateTimeout()` | PATCH | `/deployments/{deployment}/update-timeout` | Update deployment timeout |
| `deployments.submitJobResults()` | POST | `/deployments/jobs/{job}/results` | Post results for your running job. |
| `deployments.vaults.create()` | POST | `/deployments/vaults/create` | Create a shared vault. |
| `deployments.vaults.list()` | GET | `/deployments/vaults` | List all user vaults. |
| `deployments.vaults.pipe().withdraw()` | POST | `/deployments/vaults/{vault}/withdraw` | Withdraw from a vault. |

### `templates` — Deployment Templates
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `templates.get()` | GET | `/templates/{id}` | Get template by ID |
| `templates.getAllGrouped()` | GET | `/templates/grouped` | Get templates grouped by category |
| `templates.getVariant()` | GET | `/templates/{id}/{variantId}` | Get template variant |
| `templates.list()` | GET | `/templates/` | List all templates |

### `hosts` — Nodes & GPU Hosts
**Client:** Host Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `hosts.get()` | GET | `/nodes/{id}` |  |
| `hosts.getAvailableGpus()` | GET | `/nodes/available-gpus` |  |
| `hosts.getByCountry()` | GET | `/stats/nodes-country` |  |
| `hosts.getFull()` | GET | `/nodes/{id}/full` |  |
| `hosts.getInfo()` | GET | `/nodes/{id}/info` |  |
| `hosts.getMarketRelation()` | GET | `/nodes/market-relation` |  |
| `hosts.getMetrics()` | GET | `/nodes/{id}/metrics` |  |
| `hosts.getMinimumRequiredVersion()` | GET | `/nodes/minimum-required-version` |  |
| `hosts.getQueuedNodes()` | GET | `/nodes/queued-nodes` |  |
| `hosts.getRecentBenchmarks()` | GET | `/nodes/{id}/recent-benchmarks` |  |
| `hosts.getRequestMarket()` | GET | `/nodes/request-market` |  |
| `hosts.getRewards()` | GET | `/nodes/rewards` |  |
| `hosts.getRewardsById()` | GET | `/nodes/{id}/rewards` |  |
| `hosts.getUptime()` | GET | `/nodes/heartbeats/uptime/{node}` |  |
| `hosts.getWithAccess()` | GET | `/nodes/with-access` |  |
| `hosts.heartbeat()` | POST | `/nodes/heartbeat` |  |
| `hosts.list()` | GET | `/nodes/` |  |
| `hosts.payment()` | POST | `/nodes/payment` |  |
| `hosts.postMetrics()` | POST | `/nodes/{id}/metrics` |  |
| `hosts.register()` | POST | `/nodes/register` |  |
| `hosts.syncNode()` | POST | `/nodes/sync-node` |  |
| `hosts.updateAddress()` | PATCH | `/nodes/{id}/address` |  |
| `hosts.updateContact()` | PATCH | `/nodes/{id}/contact` |  |

### `stats` — Statistics & Analytics
**Client:** Blockchain Indexer

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `stats.get()` | GET | `/stats/` | Get the latest statistics |
| `stats.getEarningHistory()` | GET | `/stats/earning-history` | Flexible endpoint to retrieve earning history of node with custom date |
| `stats.getPrice()` | GET | `/stats/price` | Get NOS price for a date or timestamp |
| `stats.getSpendingHistory()` | GET | `/stats/spending-history` | Flexible endpoint to retrieve spending history with custom date ranges |

### `payments` — Payment Methods & Purchases
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `payments.addMethod()` | POST | `/payments/setup-intent` | Add payment method |
| `payments.createPaymentIntent()` | POST | `/payments/payment-intent` | Create PaymentIntent |
| `payments.deleteMethod()` | DELETE | `/payments/methods/{id}` | Delete payment method |
| `payments.listMethods()` | GET | `/payments/methods` | List payment methods |
| `payments.listPurchases()` | GET | `/payments/purchases` | List credit purchases |
| `payments.setDefaultMethod()` | PUT | `/payments/methods/{id}/default` | Set default payment method |

### `newsletter` — Newsletter
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `newsletter.subscribe()` | POST | `/newsletter/subscribe` | Subscribe To Newsletter |

### `benchmarks` — Benchmark Data & Node Benchmarks
**Client:** Host Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `benchmarks.getMarketMetricAggregates()` | GET | `/benchmarks/market-metric-aggregates` |  |
| `benchmarks.getMarketThresholds()` | GET | `/benchmarks/market-thresholds` |  |
| `benchmarks.getMetricProcessors()` | GET | `/benchmarks/metric-processors` |  |
| `benchmarks.getMetrics()` | GET | `/benchmarks/metrics` |  |
| `benchmarks.getOperations()` | GET | `/benchmarks/operations` |  |
| `benchmarks.getPrediction()` | POST | `/benchmarks/{id}/prediction` |  |
| `benchmarks.getRecent()` | GET | `/benchmarks/recent` |  |
| `benchmarks.getTemplatesConfig()` | GET | `/benchmark-templates/config` | Current stored benchmark templates — operations + metrics + their thre |
| `benchmarks.getTemplatesRefresh()` | GET | `/benchmark-templates/refresh` | Preview the benchmark template diff against stored github operations ( |
| `benchmarks.getThresholds()` | GET | `/benchmarks/thresholds` |  |
| `benchmarks.getVersion()` | GET | `/benchmarks/benchmark-version` |  |
| `benchmarks.seed()` | POST | `/benchmarks/{id}/seed` |  |
| `benchmarks.submitResults()` | POST | `/benchmarks/{id}/submit-results` |  |

---

## All prd endpoints by service

Legend: a method name = exposed as a curated SDK method; **—** = reachable only via the raw `api.clients.<service>` client (admin/ops/infra).

### Blockchain Indexer

| Method | Path | Description | SDK |
|---|---|---|---|
| GET | `/health` |  | — |
| GET | `/jobs/` | List jobs | `jobs.getAll()` |
| GET | `/jobs/{address}` | Get job by address | `jobs.get()` |
| POST | `/jobs/batch` | Get jobs by addresses | `jobs.getBatch()` |
| GET | `/jobs/count` | Count jobs | `jobs.getCount()` |
| GET | `/jobs/long-running` | Get long-running jobs | `jobs.getLongRunning()` |
| GET | `/jobs/running` | Get running jobs count per market | `jobs.getRunning()` |
| GET | `/jobs/running-nodes` | Get running nodes for a market | `jobs.getRunningNodes()` |
| GET | `/jobs/stats` | Get job statistics | `jobs.getStats()` |
| GET | `/jobs/stats/timestamps` | Get job timestamps | `jobs.getStatsTimestamps()` |
| GET | `/jobs/stats/timestamps-hours` | Get GPU compute hours over time | `jobs.getStatsTimestampsHours()` |
| GET | `/metrics` |  | — |
| GET | `/stats/` | Get the latest statistics | `stats.get()` |
| GET | `/stats/earning-history` | Flexible endpoint to retrieve earning history of node with custom date | `stats.getEarningHistory()` |
| GET | `/stats/price` | Get NOS price for a date or timestamp | `stats.getPrice()` |
| GET | `/stats/spending-history` | Flexible endpoint to retrieve spending history with custom date ranges | `stats.getSpendingHistory()` |

### Client Manager

| Method | Path | Description | SDK |
|---|---|---|---|
| GET | `/` |  | — |
| GET | `/api-keys/` | Get API Keys | `user.apiKeys.list()` |
| POST | `/api-keys/` | Create API Key | `user.apiKeys.create()` |
| GET | `/api-keys/{id}` | Get API Key | `user.apiKeys.get()` |
| POST | `/api-keys/{id}/delete` | Delete API Key | `user.apiKeys.delete()` |
| POST | `/api-keys/{id}/update` | Update API Key | `user.apiKeys.update()` |
| POST | `/auth/sign-message/external` | Sign message for external service authentication | `auth.signMessage()` |
| POST | `/auth/validate-api-key` | Validate API key | `auth.validateApiKey()` |
| POST | `/auth/validate-session` | Validate session | `auth.validateSession()` |
| GET | `/credits/balance` | Get credit balance | `credits.balance()` |
| POST | `/credits/claim` | Claim a credit code | `credits.claim()` |
| GET | `/credits/invitations/{token}` | Get invitation by token | `credits.invitations.get()` |
| POST | `/credits/invitations/{token}/claim` | Claim a credit invitation | `credits.invitations.claim()` |
| POST | `/credits/request` | Request free credits | `credits.request()` |
| GET | `/credits/request/eligibility` | Check credit request eligibility | `credits.checkEligibility()` |
| GET | `/credits/spending-history` | Get credit spending history | `credits.getSpendingHistory()` |
| GET | `/credits/transactions` | List credit transactions | `credits.getTransactions()` |
| GET | `/health` |  | — |
| POST | `/jobs/{address}/extend` | Extend a job using credits | `jobs.extend()` |
| POST | `/jobs/{address}/stop` | Stop a job paid with credits | `jobs.stop()` |
| POST | `/jobs/extend/batch` | Bulk-extend jobs using credits | `jobs.extendBatch()` |
| POST | `/jobs/list` | Create a job using credits | `jobs.list()` |
| POST | `/jobs/list/batch` | Bulk-create jobs using credits | `jobs.listBatch()` |
| POST | `/jobs/stop/batch` | Bulk-stop jobs using credits | `jobs.stopBatch()` |
| GET | `/metrics` |  | — |
| POST | `/newsletter/subscribe` | Subscribe To Newsletter | `newsletter.subscribe()` |
| GET | `/payments/methods` | List payment methods | `payments.listMethods()` |
| DELETE | `/payments/methods/{id}` | Delete payment method | `payments.deleteMethod()` |
| PUT | `/payments/methods/{id}/default` | Set default payment method | `payments.setDefaultMethod()` |
| POST | `/payments/payment-intent` | Create PaymentIntent | `payments.createPaymentIntent()` |
| GET | `/payments/purchases` | List credit purchases | `payments.listPurchases()` |
| POST | `/payments/setup-intent` | Add payment method | `payments.addMethod()` |
| POST | `/payments/webhooks/stripe` | Stripe webhook | — |
| GET | `/templates/` | List all templates | `templates.list()` |
| GET | `/templates/{id}` | Get template by ID | `templates.get()` |
| GET | `/templates/{id}/{variantId}` | Get template variant | `templates.getVariant()` |
| GET | `/templates/grouped` | Get templates grouped by category | `templates.getAllGrouped()` |

### Deployment Manager

| Method | Path | Description | SDK |
|---|---|---|---|
| GET | `/deployments` | List all user deployments. | `deployments.list()` |
| DELETE | `/deployments/{deployment}` | Delete a deployment permanently | `deployments.pipe().delete()` |
| GET | `/deployments/{deployment}` | Get a specific deployment by ID. | `deployments.get()` |
| POST | `/deployments/{deployment}/archive` | Archive a deployment | `deployments.pipe().archive()` |
| POST | `/deployments/{deployment}/create-revision` | Create a new deployment revision. | `deployments.pipe().createRevision()` |
| POST | `/deployments/{deployment}/duplicate` | Duplicate a deployment into a new DRAFT (or autostarted) deployment. | `deployments.pipe().duplicate()` |
| GET | `/deployments/{deployment}/events` | Get events for a specific deployment. | `deployments.pipe().getEvents()` |
| GET | `/deployments/{deployment}/header` | Get header for a specific deployment. | `deployments.pipe().generateAuthHeader()` |
| GET | `/deployments/{deployment}/jobs` | Get jobs for a specific deployment. | `deployments.pipe().getJobs()` |
| GET | `/deployments/{deployment}/jobs/{job}` | Get a specific deployment job by ID. | `deployments.pipe().getJob()` |
| GET | `/deployments/{deployment}/revisions` | Get revisions for a specific deployment. | `deployments.pipe().getRevisions()` |
| POST | `/deployments/{deployment}/start` | Start an existing deployment. | `deployments.pipe().start()` |
| POST | `/deployments/{deployment}/stop` | Stop a deployment | `deployments.pipe().stop()` |
| GET | `/deployments/{deployment}/tasks` | Get scheduled tasks for a specific deployment. | `deployments.pipe().getTasks()` |
| PATCH | `/deployments/{deployment}/update-active-revision` | Update deployment active revision. | `deployments.pipe().updateActiveRevision()` |
| PATCH | `/deployments/{deployment}/update-market` | Update the market of a deployment; running jobs are relisted on the new market. | `deployments.pipe().updateMarket()` |
| PATCH | `/deployments/{deployment}/update-name` | Update the name of a deployment | `deployments.pipe().updateName()` |
| PATCH | `/deployments/{deployment}/update-replica-count` | Update the replica count of a deployment | `deployments.pipe().updateReplicaCount()` |
| PATCH | `/deployments/{deployment}/update-schedule` | Update deployment schedule. | `deployments.pipe().updateSchedule()` |
| PATCH | `/deployments/{deployment}/update-timeout` | Update deployment timeout | `deployments.pipe().updateTimeout()` |
| POST | `/deployments/create` | Create a new deployment. | `deployments.create()` |
| GET | `/deployments/jobs/{job}/job-definition` | Returns the job definition for a job. | `deployments.getJobDefinition()` |
| POST | `/deployments/jobs/{job}/results` | Post results for your running job. | `deployments.submitJobResults()` |
| GET | `/deployments/vaults` | List all user vaults. | `deployments.vaults.list()` |
| POST | `/deployments/vaults/{vault}/withdraw` | Withdraw from a vault. | `deployments.vaults.pipe().withdraw()` |
| POST | `/deployments/vaults/create` | Create a shared vault. | `deployments.vaults.create()` |

### Host Manager

| Method | Path | Description | SDK |
|---|---|---|---|
| POST | `/benchmark-templates/apply` | Apply the operation/metric diff, the supplied human-reviewed threshold | — |
| GET | `/benchmark-templates/config` | Current stored benchmark templates — operations + metrics + their thre | `benchmarks.getTemplatesConfig()` |
| GET | `/benchmark-templates/refresh` | Preview the benchmark template diff against stored github operations ( | `benchmarks.getTemplatesRefresh()` |
| POST | `/benchmarks/{id}/prediction` |  | `benchmarks.getPrediction()` |
| POST | `/benchmarks/{id}/seed` |  | `benchmarks.seed()` |
| POST | `/benchmarks/{id}/submit-results` |  | `benchmarks.submitResults()` |
| GET | `/benchmarks/benchmark-version` |  | `benchmarks.getVersion()` |
| POST | `/benchmarks/benchmark-version` |  | — |
| GET | `/benchmarks/market-metric-aggregates` |  | `benchmarks.getMarketMetricAggregates()` |
| GET | `/benchmarks/market-thresholds` |  | `benchmarks.getMarketThresholds()` |
| POST | `/benchmarks/market-thresholds/create` |  | — |
| DELETE | `/benchmarks/market-thresholds/delete` |  | — |
| POST | `/benchmarks/market-thresholds/describe` |  | — |
| POST | `/benchmarks/market-thresholds/update` |  | — |
| GET | `/benchmarks/metric-processors` |  | `benchmarks.getMetricProcessors()` |
| GET | `/benchmarks/metrics` |  | `benchmarks.getMetrics()` |
| DELETE | `/benchmarks/metrics/{key}/delete` |  | — |
| POST | `/benchmarks/metrics/{key}/update` |  | — |
| POST | `/benchmarks/metrics/create` |  | — |
| GET | `/benchmarks/operations` |  | `benchmarks.getOperations()` |
| DELETE | `/benchmarks/operations/{id}/delete` |  | — |
| POST | `/benchmarks/operations/{id}/update` |  | — |
| POST | `/benchmarks/operations/create` |  | — |
| GET | `/benchmarks/recent` |  | `benchmarks.getRecent()` |
| GET | `/benchmarks/thresholds` |  | `benchmarks.getThresholds()` |
| DELETE | `/benchmarks/thresholds/{id}/delete` |  | — |
| POST | `/benchmarks/thresholds/{id}/update` |  | — |
| POST | `/benchmarks/thresholds/create` |  | — |
| GET | `/config/export` | Dump the full threshold-system configuration (groups, operations, metr | — |
| GET | `/errors/` | List error logs (admin) | — |
| POST | `/errors/report` | Submit error log (SDK) | — |
| GET | `/health` |  | — |
| GET | `/markets/` |  | `markets.list()` |
| DELETE | `/markets/{id}` |  | — |
| GET | `/markets/{id}` |  | `markets.get()` |
| PUT | `/markets/{id}` |  | — |
| GET | `/markets/{id}/required-resources` |  | `markets.getRequiredResources()` |
| GET | `/markets/docker-images` |  | `markets.getDockerImages()` |
| POST | `/markets/docker-images` |  | — |
| DELETE | `/markets/docker-images/{id}` |  | — |
| GET | `/markets/docker-images/{id}` |  | `markets.getDockerImage()` |
| PUT | `/markets/docker-images/{id}` |  | — |
| GET | `/markets/price` | Get current NOS token price in USD | `markets.getPrice()` |
| GET | `/markets/prices` |  | `markets.getPrices()` |
| GET | `/markets/remote-resources` |  | `markets.getRemoteResources()` |
| POST | `/markets/remote-resources` |  | — |
| DELETE | `/markets/remote-resources/{id}` |  | — |
| GET | `/markets/remote-resources/{id}` |  | `markets.getRemoteResource()` |
| PUT | `/markets/remote-resources/{id}` |  | — |
| POST | `/markets/update-prices` | Manually trigger market price update (admin) | — |
| GET | `/metrics` |  | — |
| GET | `/node-under-maintenance` | Public maintenance health-check (no auth) | — |
| GET | `/nodes/` |  | `hosts.list()` |
| GET | `/nodes/{id}` |  | `hosts.get()` |
| PATCH | `/nodes/{id}/address` |  | `hosts.updateAddress()` |
| PATCH | `/nodes/{id}/contact` |  | `hosts.updateContact()` |
| GET | `/nodes/{id}/full` |  | `hosts.getFull()` |
| GET | `/nodes/{id}/info` |  | `hosts.getInfo()` |
| GET | `/nodes/{id}/metrics` |  | `hosts.getMetrics()` |
| POST | `/nodes/{id}/metrics` |  | `hosts.postMetrics()` |
| GET | `/nodes/{id}/notes` |  | — |
| POST | `/nodes/{id}/notes` |  | — |
| DELETE | `/nodes/{id}/notes/{noteId}` |  | — |
| PATCH | `/nodes/{id}/notes/{noteId}` |  | — |
| GET | `/nodes/{id}/recent-benchmarks` |  | `hosts.getRecentBenchmarks()` |
| GET | `/nodes/{id}/rewards` |  | `hosts.getRewardsById()` |
| POST | `/nodes/assign-node` |  | — |
| GET | `/nodes/available-gpus` |  | `hosts.getAvailableGpus()` |
| POST | `/nodes/ban` |  | — |
| POST | `/nodes/demote` |  | — |
| POST | `/nodes/heartbeat` |  | `hosts.heartbeat()` |
| POST | `/nodes/heartbeats/aggregate-historical` |  | — |
| GET | `/nodes/heartbeats/next-max` |  | — |
| POST | `/nodes/heartbeats/next-max` |  | — |
| GET | `/nodes/heartbeats/uptime-reward-threshold-percentage` |  | — |
| POST | `/nodes/heartbeats/uptime-reward-threshold-percentage` |  | — |
| GET | `/nodes/heartbeats/uptime/{node}` |  | `hosts.getUptime()` |
| POST | `/nodes/invalidate-metrics` |  | — |
| POST | `/nodes/kick-from-queue` |  | — |
| GET | `/nodes/market-relation` |  | `hosts.getMarketRelation()` |
| GET | `/nodes/minimum-required-version` |  | `hosts.getMinimumRequiredVersion()` |
| PUT | `/nodes/minimum-required-version` |  | — |
| POST | `/nodes/move-market` |  | — |
| POST | `/nodes/payment` |  | `hosts.payment()` |
| POST | `/nodes/promote` |  | — |
| GET | `/nodes/queued-nodes` |  | `hosts.getQueuedNodes()` |
| POST | `/nodes/register` |  | `hosts.register()` |
| POST | `/nodes/remove-market-assignment` |  | — |
| GET | `/nodes/request-market` |  | `hosts.getRequestMarket()` |
| GET | `/nodes/rewards` |  | `hosts.getRewards()` |
| POST | `/nodes/sync-node` |  | `hosts.syncNode()` |
| POST | `/nodes/unban` |  | — |
| GET | `/nodes/with-access` |  | `hosts.getWithAccess()` |
| GET | `/rpc` |  | — |
| GET | `/stats/nodes-country` |  | `hosts.getByCountry()` |

---

_Coverage: 116 of 172 prd endpoints exposed as curated SDK methods; the remaining 56 (admin / ops / infra) are reachable via `api.clients`._
