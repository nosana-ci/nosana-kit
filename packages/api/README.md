# @nosana/api

TypeScript SDK for the Nosana API.

## Installation

```bash
npm install @nosana/api
```

## Quick Start

```typescript
import { createNosanaApi, NosanaNetwork } from '@nosana/api';

// Create API instance
const api = createNosanaApi(NosanaNetwork.MAINNET, 'your-api-key');

// Use the API
const jobs = await api.jobs.list();
const credits = await api.credits.get();
```

## Authentication

### API Key
```typescript
const api = createNosanaApi(NosanaNetwork.MAINNET, 'your-api-key');
```

### SignerAuth (for vault operations)

SignerAuth enables wallet-based authentication and is required for deployment vault operations (balance, topup, withdraw).

```typescript
import type { SignerAuth } from '@nosana/api';

const signerAuth: SignerAuth = {
  identifier: 'wallet-public-key',
  generate: async (message: string) => {
    // Sign message with wallet
    return signedMessage;
  },
  solana: {
    getBalance: async (address: string) => ({ SOL: 0, NOS: 0 }),
    transferTokensToRecipient: async (recipient, tokens) => { /* ... */ },
    deserializeSignSendAndConfirmTransaction: async (tx) => 'signature',
  },
};

const api = createNosanaApi(NosanaNetwork.MAINNET, signerAuth);

// Use vault methods
const vault = await api.deployments.vaults.create();
await vault.topup({ NOS: 100 });
```

**Note:** When using `@nosana/kit`, SignerAuth is automatically created from your wallet.

## API Modules

### `api.auth` — Authentication

| Method | Parameters | Returns |
|--------|-----------|---------|
| `signMessage` | `message: string, options?: { includeTime?: boolean }` | `Promise<string>` |
| `validateSession` | `cookieHeader?: string` | `Promise<ValidateSessionResponse>` |
| `validateApiKey` | `apiKey: string` | `Promise<ValidateApiKeyResponse>` |

### `api.user` — API Key Management

| Method | Parameters | Returns |
|--------|-----------|---------|
| `apiKeys.create` | `request: CreateApiKeyRequest` | `Promise<ApiKeyCreated>` |
| `apiKeys.list` | — | `Promise<{ keys: ApiKey[]; total: number }>` |
| `apiKeys.get` | `id: string` | `Promise<ApiKey>` |
| `apiKeys.update` | `id: string, request: UpdateApiKeyRequest` | `Promise<ApiKey>` |
| `apiKeys.delete` | `id: string` | `Promise<{ success: boolean }>` |

### `api.jobs` — Job Operations

| Method | Parameters | Returns |
|--------|-----------|---------|
| `get` | `address: string` | `Promise<Job>` |
| `getAll` | `request?: NosanaApiGetAllJobsRequest` | `Promise<Job[]>` |
| `list` | `request: NosanaApiListJobRequest` | `Promise<NosanaApiListJobResponse>` |
| `extend` | `{ address, ...body }: NosanaApiExtendJobRequest` | `Promise<NosanaApiExtendJobResponse>` |
| `stop` | `address: string` | `Promise<StopJobWithCreditsResponse>` |
| `getRunning` | — | `Promise<Record<string, unknown>>` |
| `getRunningNodes` | `request: JobRunningNodesRequest` | `Promise<Record<string, unknown>>` |
| `getLongRunning` | `request?: JobLongRunningRequest` | `Promise<Record<string, unknown>>` |
| `getStats` | `request?: JobStatsRequest` | `Promise<Record<string, unknown>>` |
| `getStatsTimestamps` | `request?: JobStatsTimestampsRequest` | `Promise<Record<string, unknown>>` |
| `getCount` | `request?: JobCountRequest` | `Promise<JobCountResponse>` |
| `getBatch` | `request: JobBatchRequest` | `Promise<Job[]>` |

### `api.credits` — Credits & Invitations

| Method | Parameters | Returns |
|--------|-----------|---------|
| `balance` | — | `Promise<Balance>` |
| `claim` | `code: string` | `Promise<Record<string, unknown>>` |
| `request` | — | `Promise<Record<string, unknown>>` |
| `checkEligibility` | — | `Promise<Record<string, unknown>>` |
| `invitations.get` | `token: string` | `Promise<Record<string, unknown>>` |
| `invitations.claim` | `token: string` | `Promise<Record<string, unknown>>` |

### `api.markets` — GPU Markets & Pricing

| Method | Parameters | Returns |
|--------|-----------|---------|
| `list` | — | `Promise<Market[]>` |
| `get` | `market: string` | `Promise<Market>` |
| `getRequiredResources` | `market: string` | `Promise<MarketRequiredResources>` |
| `getPrices` | — | `Promise<Record<string, unknown>>` |
| `getPrice` | — | `Promise<Record<string, unknown>>` |
| `getGpuTypes` | — | `Promise<Record<string, unknown>[]>` |
| `getDockerImages` | — | `Promise<Record<string, unknown>[]>` |

### `api.deployments` — Deployment Lifecycle

| Method | Parameters | Returns |
|--------|-----------|---------|
| `create` | `deploymentBody: CreateDeployment` | `Promise<Deployment>` |
| `get` | `deployment: string` | `Promise<Deployment>` |
| `list` | `searchParams?: DeploymentsSearchParams` | `Promise<DeploymentListResult>` |
| `pipe` | `deploymentIDorCreateObject, ...actions` | `Promise<Deployment>` |
| `getJobDefinition` | `job: string` | `Promise<unknown>` |
| `submitJobResults` | `job: string, results: JobResults` | `Promise<void>` |
| `vaults.create` | — | `Promise<Vault>` |
| `vaults.list` | — | `Promise<Vault[]>` |

**Deployment instance methods** (returned by `create`, `get`, `pipe`):

| Method | Parameters | Returns |
|--------|-----------|---------|
| `start` | — | `Promise<void>` |
| `stop` | — | `Promise<void>` |
| `archive` | — | `Promise<void>` |
| `delete` | — | `Promise<void>` |
| `getTasks` | `params?: PaginationParams` | `Promise<TaskListResult>` |
| `getJob` | `job: string` | `Promise<unknown>` |
| `getJobs` | `searchParams?: DeploymentJobsSearchParams` | `Promise<JobListResult>` |
| `getRevisions` | `searchParams?: DeploymentRevisionsSearchParams` | `Promise<RevisionListResult>` |
| `getEvents` | `searchParams?: DeploymentEventsSearchParams` | `Promise<EventListResult>` |
| `createRevision` | `jobDefinition: JobDefinition` | `Promise<void>` |
| `updateReplicaCount` | `replicas: number` | `Promise<void>` |
| `updateTimeout` | `timeout: number` | `Promise<void>` |
| `updateActiveRevision` | `active_revision: number` | `Promise<void>` |
| `updateSchedule` | `schedule: string` | `Promise<void>` |
| `generateAuthHeader` | — | `Promise<unknown>` |

### `api.templates` — Deployment Templates

| Method | Parameters | Returns |
|--------|-----------|---------|
| `list` | — | `Promise<Template[]>` |
| `getAllGrouped` | — | `Promise<Record<string, unknown>>` |
| `get` | `id: string` | `Promise<Template>` |
| `getVariant` | `id: string, variantId: string` | `Promise<Template>` |

### `api.hosts` — Nodes & Hosts

| Method | Parameters | Returns |
|--------|-----------|---------|
| `list` | `request?: NodeListRequest` | `Promise<Record<string, unknown>>` |
| `get` | `id: string` | `Promise<Record<string, unknown>>` |
| `getSpecs` | `id: string` | `Promise<Record<string, unknown>>` |
| `getAvailableGpus` | — | `Promise<Record<string, unknown>>` |
| `getStats` | — | `Promise<Record<string, unknown>>` |
| `getQueuedNodes` | `request?: NodeQueuedRequest` | `Promise<Record<string, unknown>>` |
| `getUptime` | `node: string, request?: NodeUptimeRequest` | `Promise<Record<string, unknown>>` |
| `getByCountry` | — | `Promise<Record<string, unknown>>` |
| `getAvailableHosts` | `request?: HostsFilterRequest` | `Promise<Record<string, unknown>>` |
| `getFilters` | `request?: HostsFiltersOptionsRequest` | `Promise<Record<string, unknown>>` |
| `getBenchmarkReport` | `request?: BenchmarkReportRequest` | `Promise<Record<string, unknown>>` |
| `getTemplatePerformance` | `nodeId: string` | `Promise<Record<string, unknown>>` |
| `getBenchmarkSummary` | `request?: BenchmarkSummaryRequest` | `Promise<Record<string, unknown>>` |

### `api.stats` — Platform Statistics

| Method | Parameters | Returns |
|--------|-----------|---------|
| `get` | — | `Promise<Record<string, unknown>>` |
| `getPrice` | `request?: StatsPriceRequest` | `Promise<unknown>` |
| `getSpendingHistory` | `request: StatsHistoryRequest` | `Promise<Record<string, unknown>>` |
| `getEarningHistory` | `request: StatsHistoryRequest` | `Promise<Record<string, unknown>>` |

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for the full endpoint reference.

## Development

```bash
npm install
npm test
npm run build
```

For more info go to [learn.nosana.com](https://learn.nosana.com)