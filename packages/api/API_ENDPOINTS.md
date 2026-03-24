# API Endpoints

Complete reference for the `@nosana/api` SDK route groups and their corresponding service endpoints.

## Clients

| Client | Framework | Base URL (mainnet) | Swagger | Schema status |
|---|---|---|---|---|
| **Blockchain Indexer** | Elysia | `https://blockchain-indexer.k8s.prd.nos.ci` | `/swagger` | ✅ Generated from swagger |
| **Client Manager** | Elysia | `https://client-manager.k8s.prd.nosana.com` | ❌ None | ✅ Manually maintained |
| **Deployment Manager** | Fastify | `https://deployment-manager.k8s.prd.nos.ci` | `/documentation/json` | ✅ Generated from swagger |
| **Host Manager** | Elysia | `https://host-manager.k8s.prd.nosana.com` | `/swagger` | ✅ Generated from swagger |

---

## SDK Route Groups

### `auth` — Authentication
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `signMessage()` | POST | `/auth/sign-message/external` | Sign message for external service auth |
| `validateSession()` | POST | `/auth/validate-session` | Validate SuperTokens session |
| `validateApiKey()` | POST | `/auth/validate-api-key` | Validate API key |

### `user` — User Profile & API Keys
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `getProfile()` | GET | `/user/profile` | Get authenticated user profile |
| `apiKeys.create()` | POST | `/api-keys/` | Create API key |
| `apiKeys.list()` | GET | `/api-keys/` | List user's API keys |
| `apiKeys.get()` | GET | `/api-keys/{id}` | Get API key by ID |
| `apiKeys.update()` | POST | `/api-keys/{id}/update` | Update API key |
| `apiKeys.delete()` | POST | `/api-keys/{id}/delete` | Delete API key |

### `jobs` — Job Operations
**Clients:** Blockchain Indexer (reads) + Client Manager (writes)

| SDK method | HTTP | Service | Path | Description |
|---|---|---|---|---|
| `get()` | GET | Blockchain Indexer | `/jobs/{address}` | Get job by address |
| `list()` | GET | Blockchain Indexer | `/jobs/` | Query jobs (filter by state, market, node, poster, payer) |
| `create()` | POST | Client Manager | `/jobs/list` | Create a job using credits |
| `extend()` | POST | Client Manager | `/jobs/{address}/extend` | Extend job duration using credits |
| `stop()` | POST | Client Manager | `/jobs/{address}/stop` | Stop a job (refund remaining credits) |
| `getRunning()` | GET | Blockchain Indexer | `/jobs/running` | Running jobs count per market |
| `getRunningNodes()` | GET | Blockchain Indexer | `/jobs/running-nodes` | Running nodes for a market |
| `getLongRunning()` | GET | Blockchain Indexer | `/jobs/long-running` | Long-running jobs |
| `getStats()` | GET | Blockchain Indexer | `/jobs/stats` | Aggregated job statistics |
| `getStatsTimestamps()` | GET | Blockchain Indexer | `/jobs/stats/timestamps` | Job timestamps |
| `getCount()` | GET | Blockchain Indexer | `/jobs/count` | Count jobs by state |
| `getBatch()` | POST | Blockchain Indexer | `/jobs/batch` | Get jobs by addresses (max 100) |

### `credits` — Credit Balance & Management
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `balance()` | GET | `/credits/balance` | Get user's credit balance |
| `claim()` | POST | `/credits/claim` | Claim a credit code |
| `request()` | POST | `/credits/request` | Request free credits |
| `checkEligibility()` | GET | `/credits/request/eligibility` | Check free credit eligibility |
| `invitations.get()` | GET | `/credits/invitations/{token}` | Get invitation details (public) |
| `invitations.claim()` | POST | `/credits/invitations/{token}/claim` | Claim invitation credits |

### `markets` — GPU Markets & Pricing
**Client:** Host Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `get()` | GET | `/markets/{id}` | Get market by ID |
| `list()` | GET | `/markets/` | List all markets |
| `getRequiredResources()` | GET | `/markets/{id}/required-resources` | Get required resources for a market |
| `getPrices()` | GET | `/markets/prices` | All market prices |
| `getPrice()` | GET | `/markets/price` | Current NOS token price (USD) |
| `getGpuTypes()` | GET | `/markets/gpu-types` | List GPU types |
| `getDockerImages()` | GET | `/markets/docker-images` | List Docker images |

### `deployments` — Deployment Lifecycle
**Client:** Deployment Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `create()` | POST | `/api/deployments/create` | Create new deployment |
| `get()` | GET | `/api/deployments/{deployment}` | Get deployment by ID |
| `list()` | GET | `/api/deployments` | List all deployments |
| `pipe()` | — | — | Chain operations on a deployment |
| _deployment_.`start()` | POST | `/api/deployments/{deployment}/start` | Start deployment |
| _deployment_.`stop()` | POST | `/api/deployments/{deployment}/stop` | Stop deployment |
| _deployment_.`archive()` | POST | `/api/deployments/{deployment}/archive` | Archive deployment |
| _deployment_.`delete()` | DELETE | `/api/deployments/{deployment}` | Delete deployment |
| _deployment_.`getTasks()` | GET | `/api/deployments/{deployment}/tasks` | Get scheduled tasks |
| _deployment_.`getJobs()` | GET | `/api/deployments/{deployment}/jobs` | Get deployment jobs |
| _deployment_.`getJob()` | GET | `/api/deployments/{deployment}/jobs/{job}` | Get specific job |
| _deployment_.`getRevisions()` | GET | `/api/deployments/{deployment}/revisions` | Get revisions |
| _deployment_.`getEvents()` | GET | `/api/deployments/{deployment}/events` | Get events |
| _deployment_.`createRevision()` | POST | `/api/deployments/{deployment}/create-revision` | Create revision |
| _deployment_.`updateReplicaCount()` | PATCH | `/api/deployments/{deployment}/update-replica-count` | Update replica count |
| _deployment_.`updateActiveRevision()` | PATCH | `/api/deployments/{deployment}/update-active-revision` | Switch active revision |
| _deployment_.`updateTimeout()` | PATCH | `/api/deployments/{deployment}/update-timeout` | Update timeout |
| _deployment_.`updateSchedule()` | PATCH | `/api/deployments/{deployment}/update-schedule` | Update schedule |
| _deployment_.`generateAuthHeader()` | GET | `/api/deployments/{deployment}/header` | Get deployment auth header |
| `getJobDefinition()` | GET | `/api/deployments/jobs/{job}/job-definition` | Get job definition (node-facing) |
| `submitJobResults()` | POST | `/api/deployments/jobs/{job}/results` | Submit job results (node-facing) |
| `vaults.create()` | POST | `/api/deployments/vaults/create` | Create shared vault |
| `vaults.list()` | GET | `/api/deployments/vaults` | List vaults |
| _vault_.`topup()` | — | — | Transfer SOL/NOS to vault (Solana tx) |
| _vault_.`withdraw()` | POST | `/api/deployments/vaults/{vault}/withdraw` | Withdraw from vault |
| _vault_.`getBalance()` | — | — | Get vault SOL/NOS balance (Solana RPC) |

### `templates` — Deployment Templates
**Client:** Client Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `list()` | GET | `/templates/` | List all templates |
| `getAllGrouped()` | GET | `/templates/grouped` | Templates grouped by category |
| `get()` | GET | `/templates/{id}` | Get template by ID |
| `getVariant()` | GET | `/templates/{id}/{variantId}` | Get template variant |

### `hosts` — Nodes & GPU Hosts
**Client:** Host Manager

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `list()` | GET | `/nodes/` | List all nodes |
| `get()` | GET | `/nodes/{id}` | Get node details |
| `getSpecs()` | GET | `/nodes/{id}/specs` | Get node system specs |
| `getAvailableGpus()` | GET | `/nodes/available-gpus` | Available GPU types |
| `getStats()` | GET | `/nodes/stats` | Node statistics |
| `getQueuedNodes()` | GET | `/nodes/queued-nodes` | Queued nodes for market |
| `getUptime()` | GET | `/nodes/heartbeats/uptime/{node}` | Node uptime percentage |
| `getByCountry()` | GET | `/stats/nodes-country` | Node distribution by country |
| `getAvailableHosts()` | GET | `/hosts/` | Available hosts matching filter criteria |
| `getFilters()` | GET | `/hosts/filters` | GPU filter options |
| `getBenchmarkReport()` | GET | `/benchmarks/node-report` | Node benchmark report |
| `getTemplatePerformance()` | GET | `/benchmarks/node-template-performance/{nodeId}` | Node template performance |
| `getBenchmarkSummary()` | GET | `/benchmarks/markets/benchmark-summary` | Per-market benchmark summary |

### `stats` — Statistics & Analytics
**Client:** Blockchain Indexer

| SDK method | HTTP | Path | Description |
|---|---|---|---|
| `get()` | GET | `/stats/` | Latest aggregated statistics |
| `getPrice()` | GET | `/stats/price` | NOS token price |
| `getSpendingHistory()` | GET | `/stats/spending-history` | Spending history |
| `getEarningHistory()` | GET | `/stats/earning-history` | Node earnings history |

---

## All Endpoints by Service

### Blockchain Indexer

| Method | Path | Description | SDK Group |
|---|---|---|---|
| GET | `/health` | Health check | — |
| **Jobs** | | | |
| GET | `/jobs/` | List jobs (filter by state, market, node, poster, payer) | `jobs.list()` |
| GET | `/jobs/{address}` | Get job by address | `jobs.get()` |
| GET | `/jobs/running` | Running jobs count per market | `jobs.getRunning()` |
| GET | `/jobs/running-nodes` | Running nodes for a market | `jobs.getRunningNodes()` |
| GET | `/jobs/long-running` | Long-running jobs | `jobs.getLongRunning()` |
| GET | `/jobs/stats` | Aggregated job statistics | `jobs.getStats()` |
| GET | `/jobs/stats/timestamps` | Job timestamps | `jobs.getStatsTimestamps()` |
| GET | `/jobs/count` | Count jobs by state | `jobs.getCount()` |
| POST | `/jobs/batch` | Get jobs by addresses (max 100) | `jobs.getBatch()` |
| **Stats** | | | |
| GET | `/stats/` | Latest statistics | `stats.get()` |
| GET | `/stats/price` | NOS price | `stats.getPrice()` |
| GET | `/stats/spending-history` | Spending history | `stats.getSpendingHistory()` |
| GET | `/stats/earning-history` | Node earnings history | `stats.getEarningHistory()` |

### Client Manager

| Method | Path | Auth | Description | SDK Group |
|---|---|---|---|---|
| GET | `/` | — | Status check | — |
| GET | `/health` | — | Health check | — |
| **Auth** | | | | |
| POST | `/auth/validate-session` | — | Validate SuperTokens session | `auth.validateSession()` |
| POST | `/auth/validate-api-key` | — | Validate API key | `auth.validateApiKey()` |
| POST | `/auth/sign-message/external` | Hybrid | Sign message for external service | `auth.signMessage()` |
| ALL | `/auth/*` | — | SuperTokens proxy | — _(internal)_ |
| **User** | | | | |
| GET | `/user/profile` | SuperTokens | Get user profile | `user.getProfile()` |
| **API Keys** | | | | |
| POST | `/api-keys/` | Hybrid | Create API key | `user.apiKeys.create()` |
| GET | `/api-keys/` | Hybrid | List user's API keys | `user.apiKeys.list()` |
| GET | `/api-keys/{id}` | Hybrid | Get API key | `user.apiKeys.get()` |
| POST | `/api-keys/{id}/update` | Hybrid | Update API key | `user.apiKeys.update()` |
| POST | `/api-keys/{id}/delete` | Hybrid | Delete API key | `user.apiKeys.delete()` |
| **Credits** | | | | |
| GET | `/credits/balance` | SuperTokens | Get credit balance | `credits.balance()` |
| POST | `/credits/claim` | SuperTokens | Claim credit code | `credits.claim()` |
| POST | `/credits/request` | SuperTokens | Request free credits | `credits.request()` |
| GET | `/credits/request/eligibility` | SuperTokens | Check free credit eligibility | `credits.checkEligibility()` |
| GET | `/credits/invitations/{token}` | — | Get invitation details | `credits.invitations.get()` |
| POST | `/credits/invitations/{token}/claim` | SuperTokens | Claim invitation | `credits.invitations.claim()` |
| GET | `/credits/admin/codes` | Admin | List credit codes | — _(admin)_ |
| GET | `/credits/admin/accounts` | Admin | List user accounts | — _(admin)_ |
| GET | `/credits/admin/accounts/{userId}` | Admin | Get user account | — _(admin)_ |
| POST | `/credits/admin/codes` | Admin | Create credit code | — _(admin)_ |
| POST | `/credits/admin/codes/{code}/update` | Admin | Update credit code | — _(admin)_ |
| POST | `/credits/admin/codes/{code}/delete` | Admin | Delete credit code | — _(admin)_ |
| POST | `/credits/admin/invitations` | Admin | Create invitation | — _(admin)_ |
| POST | `/credits/admin/invitations/bulk` | Admin | Create bulk invitations | — _(admin)_ |
| GET | `/credits/admin/user-credit-alert-threshold-usd` | Admin | Get alert threshold | — _(admin)_ |
| POST | `/credits/admin/user-credit-alert-threshold-usd` | Admin | Set alert threshold | — _(admin)_ |
| GET | `/credits/admin/request/config` | Admin | Get free credit request config | — _(admin)_ |
| POST | `/credits/admin/request/config` | Admin | Set free credit request config | — _(admin)_ |
| **Jobs** | | | | |
| POST | `/jobs/list` | Hybrid | Create job using credits | `jobs.create()` |
| POST | `/jobs/{address}/extend` | Hybrid | Extend job using credits | `jobs.extend()` |
| POST | `/jobs/{address}/stop` | Hybrid | Stop job (refund credits) | `jobs.stop()` |
| **Templates** | | | | |
| GET | `/templates/` | — | List all templates | `templates.list()` |
| GET | `/templates/grouped` | — | Templates grouped by category | `templates.getAllGrouped()` |
| GET | `/templates/{id}` | — | Get template by ID | `templates.get()` |
| GET | `/templates/{id}/{variantId}` | — | Get template variant | `templates.getVariant()` |
| **Tracker** | | | | |
| GET | `/tracker/` | Admin | List tracked wallets | — _(admin)_ |
| POST | `/tracker/` | Admin | Add tracked wallet | — _(admin)_ |
| POST | `/tracker/{name}/update` | Admin | Update tracked wallet | — _(admin)_ |
| POST | `/tracker/{name}/delete` | Admin | Delete tracked wallet | — _(admin)_ |
| **Deployments** | | | | |
| ALL | `/deployments/*` | Optional | Proxy to deployment-manager | — _(proxy)_ |

### Deployment Manager

| Method | Path | Description | SDK Group |
|---|---|---|---|
| GET | `/` | Health check | — |
| GET | `/stats` | Get stats | — |
| **Deployments** | | | |
| GET | `/api/deployments` | List all deployments | `deployments.list()` |
| GET | `/api/deployments/{deployment}` | Get deployment by ID | `deployments.get()` |
| DELETE | `/api/deployments/{deployment}` | Delete deployment | `deployments.pipe().delete()` |
| POST | `/api/deployments/create` | Create new deployment | `deployments.create()` |
| POST | `/api/deployments/{deployment}/start` | Start deployment | `deployments.pipe().start()` |
| POST | `/api/deployments/{deployment}/stop` | Stop deployment | `deployments.pipe().stop()` |
| POST | `/api/deployments/{deployment}/archive` | Archive deployment | `deployments.pipe().archive()` |
| POST | `/api/deployments/{deployment}/create-revision` | Create revision | `deployments.pipe().createRevision()` |
| PATCH | `/api/deployments/{deployment}/update-active-revision` | Switch active revision | `deployments.pipe().updateActiveRevision()` |
| PATCH | `/api/deployments/{deployment}/update-replica-count` | Update replica count | `deployments.pipe().updateReplicaCount()` |
| PATCH | `/api/deployments/{deployment}/update-schedule` | Update schedule | `deployments.pipe().updateSchedule()` |
| PATCH | `/api/deployments/{deployment}/update-timeout` | Update timeout | `deployments.pipe().updateTimeout()` |
| GET | `/api/deployments/{deployment}/tasks` | Get scheduled tasks | `deployments.pipe().getTasks()` |
| GET | `/api/deployments/{deployment}/header` | Get deployment header | `deployments.pipe().generateAuthHeader()` |
| GET | `/api/deployments/{deployment}/jobs` | Get deployment jobs | `deployments.pipe().getJobs()` |
| GET | `/api/deployments/{deployment}/jobs/{job}` | Get specific job | `deployments.pipe().getJob()` |
| GET | `/api/deployments/{deployment}/revisions` | Get revisions | `deployments.pipe().getRevisions()` |
| GET | `/api/deployments/{deployment}/events` | Get events | `deployments.pipe().getEvents()` |
| **Jobs (node-facing)** | | | |
| GET | `/api/deployments/jobs/{job}/job-definition` | Get job definition | `deployments.getJobDefinition()` |
| POST | `/api/deployments/jobs/{job}/results` | Submit job results | `deployments.submitJobResults()` |
| **Vaults** | | | |
| GET | `/api/deployments/vaults` | List vaults | `deployments.vaults.list()` |
| POST | `/api/deployments/vaults/create` | Create shared vault | `deployments.vaults.create()` |
| POST | `/api/deployments/vaults/{vault}/withdraw` | Withdraw from vault | `deployments.vaults.pipe().withdraw()` |

### Host Manager

| Method | Path | Description | SDK Group |
|---|---|---|---|
| GET | `/health` | Health check | — |
| GET | `/rpc` | Solana RPC URL | — |
| **Markets** | | | |
| GET | `/markets/` | List markets | `markets.list()` |
| GET | `/markets/{id}` | Get market by ID | `markets.get()` |
| GET | `/markets/{id}/required-resources` | Get market required resources | `markets.getRequiredResources()` |
| GET | `/markets/prices` | All market prices | `markets.getPrices()` |
| GET | `/markets/price` | Current NOS price (USD) | `markets.getPrice()` |
| GET | `/markets/gpu-types` | List GPU types | `markets.getGpuTypes()` |
| GET | `/markets/gpu-types/{id}` | Get GPU type by ID | — |
| GET | `/markets/docker-images` | List Docker images | `markets.getDockerImages()` |
| GET | `/markets/docker-images/{id}` | Get Docker image by ID | — |
| GET | `/markets/remote-resources` | List required resources | — |
| GET | `/markets/remote-resources/{id}` | Get resource by ID | — |
| POST | `/markets/` | Create market (admin) | — _(admin)_ |
| PUT | `/markets/{id}` | Update market (admin) | — _(admin)_ |
| DELETE | `/markets/{id}` | Delete market (admin) | — _(admin)_ |
| POST | `/markets/gpu-types` | Add GPU type (admin) | — _(admin)_ |
| PUT | `/markets/gpu-types/{id}` | Update GPU type (admin) | — _(admin)_ |
| DELETE | `/markets/gpu-types/{id}` | Delete GPU type (admin) | — _(admin)_ |
| POST | `/markets/docker-images` | Add Docker image (admin) | — _(admin)_ |
| PUT | `/markets/docker-images/{id}` | Update Docker image (admin) | — _(admin)_ |
| DELETE | `/markets/docker-images/{id}` | Delete Docker image (admin) | — _(admin)_ |
| POST | `/markets/remote-resources` | Add remote resource (admin) | — _(admin)_ |
| PUT | `/markets/remote-resources/{id}` | Update remote resource (admin) | — _(admin)_ |
| DELETE | `/markets/remote-resources/{id}` | Delete remote resource (admin) | — _(admin)_ |
| POST | `/markets/update-prices` | Refresh market prices (admin) | — _(admin)_ |
| **Nodes** | | | |
| GET | `/nodes/` | List nodes | `hosts.list()` |
| GET | `/nodes/{id}` | Get node details (wallet) | `hosts.get()` |
| GET | `/nodes/{id}/full` | Get full node info (admin) | — _(admin)_ |
| GET | `/nodes/{id}/specs` | Get node system specs | `hosts.getSpecs()` |
| GET | `/nodes/{id}/info` | Get private node info (admin) | — _(admin)_ |
| GET | `/nodes/available-gpus` | Available GPUs | `hosts.getAvailableGpus()` |
| GET | `/nodes/stats` | Node statistics | `hosts.getStats()` |
| GET | `/nodes/minimum-required-version` | Min node version | — |
| GET | `/nodes/with-access` | Nodes with market access | — |
| GET | `/nodes/queued-nodes` | Queued nodes | `hosts.getQueuedNodes()` |
| GET | `/nodes/market-relation` | Market relation | — |
| GET | `/nodes/metrics` | Metric definitions | — |
| POST | `/nodes/onboard` | Onboard node (admin) | — _(admin)_ |
| POST | `/nodes/upgrade` | Upgrade node (admin) | — _(admin)_ |
| POST | `/nodes/assign-node` | Assign node to market (admin) | — _(admin)_ |
| POST | `/nodes/remove-market-assignment` | Remove assignment (admin) | — _(admin)_ |
| POST | `/nodes/change-market` | Change node market (wallet) | — _(wallet)_ |
| POST | `/nodes/sync-node` | Sync node state | — _(wallet)_ |
| POST | `/nodes/register` | Register node (wallet) | — _(wallet)_ |
| GET | `/nodes/request-market` | Request market assignment (wallet) | — _(wallet)_ |
| POST | `/nodes/join-test-grid` | Join test grid (wallet) | — _(wallet)_ |
| POST | `/nodes/revoke` | Revoke node (admin) | — _(admin)_ |
| PUT | `/nodes/minimum-required-version` | Update required version (admin) | — _(admin)_ |
| POST | `/nodes/{id}/submit-system-specs` | Submit system specs (SDK) | — _(SDK internal)_ |
| PATCH | `/nodes/{id}/address` | Update node address (wallet) | — _(wallet)_ |
| POST | `/nodes/{id}/check-market` | Check market compatibility (wallet) | — _(wallet)_ |
| POST | `/nodes/heartbeat` | Node heartbeat (wallet) | — _(wallet)_ |
| POST | `/nodes/payment` | Request NOS payment (wallet) | — _(wallet)_ |
| GET | `/nodes/heartbeats/uptime/{node}` | Node uptime % | `hosts.getUptime()` |
| GET | `/nodes/heartbeats/next-max` | Next max heartbeats (admin) | — _(admin)_ |
| POST | `/nodes/heartbeats/next-max` | Set next max heartbeats (admin) | — _(admin)_ |
| GET | `/nodes/heartbeats/uptime-reward-threshold-percentage` | Threshold % (admin) | — _(admin)_ |
| POST | `/nodes/heartbeats/uptime-reward-threshold-percentage` | Set threshold % (admin) | — _(admin)_ |
| POST | `/nodes/heartbeats/aggregate-historical` | Backfill aggregation (admin) | — _(admin)_ |
| **Hosts** | | | |
| GET | `/hosts/` | Available hosts matching filter criteria | `hosts.getAvailableHosts()` |
| GET | `/hosts/filters` | GPU filter options | `hosts.getFilters()` |
| **Benchmarks** | | | |
| GET | `/benchmarks/node-report` | Node benchmark report | `hosts.getBenchmarkReport()` |
| GET | `/benchmarks/node-template-performance/{nodeId}` | Node template performance | `hosts.getTemplatePerformance()` |
| GET | `/benchmarks/benchmark-version` | Current benchmark version | — |
| GET | `/benchmarks/markets/benchmark-summary` | Per-market benchmark summary | `hosts.getBenchmarkSummary()` |
| POST | `/benchmarks/{id}/submit-results` | Submit benchmark results (wallet) | — _(wallet)_ |
| POST | `/benchmarks/submit` | Unified benchmark submission | — _(wallet)_ |
| POST | `/benchmarks/admin-trigger-anti-spoof` | Trigger anti-spoof (admin) | — _(admin)_ |
| POST | `/benchmarks/admin-trigger-validation` | Verify anti-spoof results (admin) | — _(admin)_ |
| POST | `/benchmarks/admin-target` | Target nodes for anti-spoof (admin) | — _(admin)_ |
| POST | `/benchmarks/benchmark-version` | Update benchmark version (admin) | — _(admin)_ |
| GET | `/benchmarks/thresholds` | List onboarding thresholds (admin) | — _(admin)_ |
| POST | `/benchmarks/thresholds/create` | Create threshold (admin) | — _(admin)_ |
| POST | `/benchmarks/thresholds/{id}/update` | Update threshold (admin) | — _(admin)_ |
| DELETE | `/benchmarks/thresholds/{id}/delete` | Delete threshold (admin) | — _(admin)_ |
| GET | `/benchmarks/benchmarks` | List onboarding benchmarks (admin) | — _(admin)_ |
| POST | `/benchmarks/benchmarks/create` | Create benchmark (admin) | — _(admin)_ |
| POST | `/benchmarks/benchmarks/{id}/update` | Update benchmark (admin) | — _(admin)_ |
| DELETE | `/benchmarks/benchmarks/{id}/delete` | Delete benchmark (admin) | — _(admin)_ |
| POST | `/benchmarks/admin-clear-benchmark-data` | Clear benchmark data (admin) | — _(admin)_ |
| POST | `/benchmarks/selector` | Template benchmark selector (admin) | — _(admin)_ |
| **Errors** | | | |
| POST | `/errors/report` | Report node error (SDK) | — _(SDK internal)_ |
| GET | `/errors/` | List errors (admin) | — _(admin)_ |
| **Stats** | | | |
| GET | `/stats/nodes-country` | Node distribution by country | `hosts.getByCountry()` |
| **Templates** | | | |
| GET | `/templates/` | List templates | — _(host-manager copy)_ |
| GET | `/templates/{id}` | Get template by ID | — _(host-manager copy)_ |
| POST | `/templates/admin-refresh` | Refresh from GitHub (admin) | — _(admin)_ |
