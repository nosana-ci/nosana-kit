---
title: Manage Deployments
---

# Manage Deployments

Use the Nosana REST API or TypeScript SDK to list, inspect, stop, and archive deployments.

## Prerequisites

- **API Key**: See the [API key guide](/api/get-api-key).
- **Existing deployments**: Created via the API, SDK, or dashboard.

All examples assume you have your API key set up. For the SDK, initialize the client:

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: {
    apiKey: process.env.NOSANA_API_KEY as string,
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

```ts
const deployments = await client.deployments.list();
```

== HTTP API

```bash
curl -s \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://dashboard.k8s.prd.nos.ci/api/deployments | jq .
```

:::

## Get a Deployment

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
```

== HTTP API

```bash
curl -s \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://dashboard.k8s.prd.nos.ci/api/deployments/YOUR_DEPLOYMENT_ID | jq .
```

:::

## Update Job Definition (Create a Revision)

Create a new revision of the job definition for an existing deployment:

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');

const revision = await deployment.createRevision({
  job_definition: {
    // New job definition fields go here
  },
});
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d @job-definition.json \
  https://dashboard.k8s.prd.nos.ci/api/deployments/YOUR_DEPLOYMENT_ID/revisions | jq .
```

:::

The body should contain a `job_definition` matching the structure described in the job definition docs.

## Update Replica Count

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.updateReplicas(3);
```

== HTTP API

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"replicas": 3}' \
  https://dashboard.k8s.prd.nos.ci/api/deployments/YOUR_DEPLOYMENT_ID/update-replicas | jq .
```

:::

## Update Schedule (SCHEDULED Strategy Only)

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.updateSchedule('0 0 * * *'); // daily at midnight
```

== HTTP API

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"schedule": "0 0 * * *"}' \
  https://dashboard.k8s.prd.nos.ci/api/deployments/YOUR_DEPLOYMENT_ID/update-schedule | jq .
```

:::

> **Note**: The schedule only applies to deployments using the `SCHEDULED` strategy.  
> For cron syntax examples, see **[Deployment Strategies](/getting-started/deployments/strategies)**.

## Update Timeout

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.updateTimeout(120); // minutes
```

== HTTP API

```bash
curl -s \
  -X PATCH \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"timeout": 120}' \
  https://dashboard.k8s.prd.nos.ci/api/deployments/YOUR_DEPLOYMENT_ID/update-timeout | jq .
```

:::

## Start a Deployment

Start an existing deployment that is in a draft or stopped state:

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.start();
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://dashboard.k8s.prd.nos.ci/api/deployments/YOUR_DEPLOYMENT_ID/start | jq .
```

:::

## Stop a Deployment

Stop a running deployment:

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.stop();
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://dashboard.k8s.prd.nos.ci/api/deployments/<deployment_id>/stop | jq .
```

:::

The response will contain a `status` (for example `"STOPPING"`) and an `updated_at` timestamp.

## Archive a Deployment

Archive a deployment to remove it from your active list while keeping history:

:::tabs

== TypeScript SDK

```ts
const deployment = await client.deployments.get('YOUR_DEPLOYMENT_ID');
await deployment.archive();
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://dashboard.k8s.prd.nos.ci/api/deployments/<deployment_id>/archive | jq .
```

:::

The response will include `status: "ARCHIVED"` when successful.

## Pipe Multiple Deployment Operations (SDK Only)

The pipe function allows you to chain multiple actions on a deployment in a functional programming style. It can either create a new deployment or operate on an existing one.

```ts
// Create and execute multiple actions in sequence
const deployment = await client.deployments.pipe(
  {
    name: 'My Application',
    market: '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq',
    replicas: 3,
    timeout: 300,
    strategy: 'SIMPLE',
    job_definition: {},
  },
  async (deployment) => {
    console.log('Starting deployment');
    await deployment.start();
  },
  async (deployment) => {
    console.log('Updating replicas');
    await deployment.updateReplicas(5);
  },
);

// Or operate on an existing deployment
const deployment = await client.deployments.pipe(
  'existing-deployment-id',
  async (deployment) => {
    await deployment.start();
  },
  async (deployment) => {
    await deployment.stop();
  }
);
```

This example gets a deployment, updates its replica count and timeout, and then starts it in one composed call.

## Full API Reference

For all deployment endpoints and fields, consult the **[API Swagger reference](https://dashboard.k8s.prd.nos.ci/api/swagger)**.
