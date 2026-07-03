---
title: Nosana API
---

# Nosana API

Nosana exposes both a REST HTTP API and a typed TypeScript SDK so you can create and manage deployments from whatever environment fits your workflow.

New here? Follow the [Your First Job guide](/api/first-job) for an end-to-end walkthrough: pick a market, validate a job definition, post it with credits, and fetch the results.

## HTTP API

Use the Nosana HTTP API to create and manage deployments from any language or environment that can make HTTPS requests.

### Prerequisites

Before calling the API, ensure you have:

- **API key**: A valid Nosana API key. See the [API key guide](/api/get-api-key).
- **Credits**: Sufficient credit balance on your Nosana account to run deployments.
- **Base URL**: The current production API base URL:

```bash
https://dashboard.k8s.prd.nos.ci/api
```

### Authentication

You can authenticate with the API in two ways:

#### API Key Authentication

All requests must include your API key as a Bearer token:

```bash
curl -H "Authorization: Bearer nos_xxx_your_api_key" ...
```

If you are using environment variables:

```bash
export NOSANA_API_KEY="nos_xxx_your_api_key"

curl -H "Authorization: Bearer $NOSANA_API_KEY" ...
```

#### Wallet Authentication

For wallet-based authentication with vault management capabilities, see the [Wallet Authentication guide](/api/wallet-authentication).

### API Reference (Swagger)

You can explore all available endpoints and schemas in the interactive Swagger UI:

- **Swagger UI**: https://dashboard.k8s.prd.nos.ci/api/swagger

Use this reference to:

- Inspect request/response payloads
- Try out endpoints directly in the browser
- Generate or validate client code

## API Modules

The Nosana API is organized into several modules — see the
[API Reference overview](/api/reference) for the full list:

- **[Deployments](/api/create-deployments)** - Create and manage deployments, including [vaults](/api/vault-management)
- **[Jobs](/api/jobs)** - Manage individual jobs, extend execution time, stop jobs
- **[Markets](/api/markets)** - Discover GPU markets and check resource requirements
- **[Credits](/api/credits)** - Check balance, claim/request credits, spending history
- **[Authentication & API Keys](/api/auth)** - Validate credentials, manage API keys
- **[Templates](/api/templates)** - Ready-made deployment templates
- **[Hosts](/api/hosts)** - Nodes & GPU hosts: discovery, metrics, rewards
- **[Stats](/api/stats)** - Network statistics, NOS price, earning/spending history
- **[Payments](/api/payments)** - Payment methods and credit purchases
- **[Benchmarks](/api/benchmarks)** - Benchmark data and thresholds
- **[Raw Clients](/api/raw-clients)** - Typed clients for every other endpoint

## TypeScript SDK

The Nosana TypeScript SDK provides a convenient, typed interface for creating and managing deployments from Node.js or browser environments.

### Prerequisites

Before using the SDK, ensure you have:

- **API Key**: A valid Nosana API key. See the [API key guide](/api/get-api-key).
- **Credits**: Sufficient credits in your Nosana account to run deployments.
- **Node.js**: A recent LTS version of Node.js is recommended.

### Installation

Install the SDK from npm:

```bash
npm install @nosana/kit
```

For more installation options and details, see the [Kit Installation Guide](/kit/installation).

### Initializing the Client

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});
```

### Route groups & raw clients

The SDK exposes the API as typed route groups under `client.api` — `auth`,
`user`, `jobs`, `credits`, `markets`, `deployments`, `templates`, `hosts`,
`stats`, `payments`, and `benchmarks`. See the
[API Reference overview](/api/reference) for every group and its methods.

For any endpoint without a curated method, use the raw, fully-typed per-service
clients at `client.api.clients.{clientManager,hostManager,blockchainIndexer,deploymentManager}`
— authentication is applied automatically. See [Raw Clients](/api/raw-clients).
