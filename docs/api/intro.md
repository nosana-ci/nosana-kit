---
title: Nosana API
---

# Nosana API

Nosana exposes both a REST HTTP API and a typed TypeScript SDK so you can create and manage deployments from whatever environment fits your workflow.

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

The Nosana API is organized into several modules:

- **[Deployments](/api/create-deployments)** - Create and manage deployments
- **[Jobs](/api/jobs)** - Manage individual jobs, extend execution time, stop jobs
- **[Markets](/api/markets)** - Discover GPU markets and check resource requirements
- **[Credits](/api/credits)** - Check balance, claim/request credits, spending history
- **[Vault Management](/api/vault-management)** - Manage vaults for wallet-based deployments
- **[SDK Route Groups](/api/sdk-route-groups)** - Full reference of every SDK route group (auth, user, jobs, credits, markets, deployments, templates, hosts, stats, payments, benchmarks, newsletter) and the raw `api.clients`

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

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: {
    apiKey: process.env.NOSANA_API_KEY as string,
  },
});
```

### Route groups & raw clients

The SDK exposes the API as typed route groups under `client.api` — `auth`,
`user`, `jobs`, `credits`, `markets`, `deployments`, `templates`, `hosts`,
`stats`, `payments`, `benchmarks`, and `newsletter`. See the
[SDK Route Groups reference](/api/sdk-route-groups) for every method.

For any endpoint without a curated method, use the raw, fully-typed per-service
clients at `client.api.clients.{clientManager,hostManager,blockchainIndexer,deploymentManager}`
— authentication is applied automatically.
