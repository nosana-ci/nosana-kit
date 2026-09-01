---
title: Manage Deployments
---

# Manage Deployments

Use the Nosana REST API or TypeScript SDK to list, inspect, stop, and archive deployments.

## Prerequisites

- **API Key**: See the [API key guide](/api/get-api-key).
- **Existing deployments**: Created via the API, SDK, or dashboard.

All examples assume you have your API key set up. For the SDK, initialize the client:

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

For the API, set your API key:

```bash
export NOSANA_API_KEY="nos_xxx_your_api_key"
```

## List Deployments

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const { deployments } = await client.api.deployments.list();
```

== HTTP API

```bash
curl -s \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://api.nosana.com/deployments | jq .
```

:::

## Get a Deployment

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
```

== HTTP API

```bash
curl -s \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://api.nosana.com/deployments/YOUR_DEPLOYMENT_ID | jq .
```

:::

## Update Job Definition (Create a Revision)

Create a new revision of the job definition for an existing deployment:

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');

await deployment.createRevision({
  version: '0.1',
  type: 'container',
  meta: { trigger: 'api' },
  ops: [
    {
      type: 'container/run',
      id: 'hello-world',
      args: {
        cmd: 'echo hello world v2',
        image: 'ubuntu',
      },
    },
  ],
});
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @job-definition.json \
  https://api.nosana.com/deployments/YOUR_DEPLOYMENT_ID/create-revision | jq .
```

:::

The body should contain a `job_definition` matching the structure described in the job definition docs.

## Update Replica Count

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.updateReplicaCount(3);
```

== HTTP API

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"replicas": 3}' \
  https://api.nosana.com/deployments/YOUR_DEPLOYMENT_ID/update-replica-count | jq .
```

:::

## Update Schedule (SCHEDULED Strategy Only)

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.updateSchedule('0 0 * * *'); // daily at midnight
```

== HTTP API

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"schedule": "0 0 * * *"}' \
  https://api.nosana.com/deployments/YOUR_DEPLOYMENT_ID/update-schedule | jq .
```

:::

> **Note**: The schedule only applies to deployments using the `SCHEDULED` strategy.  
> For cron syntax examples, see **[Deployment Strategies](/deployments/strategies)**.

## Update Timeout

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.updateTimeout(120); // minutes
```

== HTTP API

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeout": 120}' \
  https://api.nosana.com/deployments/YOUR_DEPLOYMENT_ID/update-timeout | jq .
```

:::

## Start a Deployment

Start an existing deployment that is in a draft or stopped state:

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.start();
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://api.nosana.com/deployments/YOUR_DEPLOYMENT_ID/start | jq .
```

:::

## Stop a Deployment

Stop a running deployment:

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.stop();
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://api.nosana.com/deployments/<deployment_id>/stop | jq .
```

:::

The response will contain a `status` (for example `"STOPPING"`) and an `updated_at` timestamp.

## Archive a Deployment

Archive a deployment to remove it from your active list while keeping history:

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const deployment = await client.api.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.archive();
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://api.nosana.com/deployments/<deployment_id>/archive | jq .
```

:::

The response will include `status: "ARCHIVED"` when successful.

## Pipe Multiple Deployment Operations (SDK Only)

The pipe function allows you to chain multiple actions on a deployment in a functional programming style. It can either create a new deployment or operate on an existing one.

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// Create and execute multiple actions in sequence
const deployment = await client.api.deployments.pipe(
  {
    name: 'My Application',
    market: '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq',
    replicas: 3,
    timeout: 300,
    strategy: 'SIMPLE',
    job_definition: {
      version: '0.1',
      type: 'container',
      meta: { trigger: 'api' },
      ops: [
        {
          type: 'container/run',
          id: 'my-application',
          args: {
            cmd: 'echo hello world',
            image: 'ubuntu',
          },
        },
      ],
    },
  },
  async (deployment) => {
    console.log('Starting deployment');
    await deployment.start();
  },
  async (deployment) => {
    console.log('Updating replicas');
    await deployment.updateReplicaCount(5);
  },
);

// Or operate on an existing deployment
const existing = await client.api.deployments.pipe(
  'existing-deployment-id',
  async (deployment) => {
    await deployment.start();
  },
  async (deployment) => {
    await deployment.stop();
  },
);
```

This example gets a deployment, updates its replica count and timeout, and then starts it in one composed call.

## Full API Reference

For all deployment endpoints and fields, consult the **[API Swagger reference](https://api.nosana.com/api/docs)**.
