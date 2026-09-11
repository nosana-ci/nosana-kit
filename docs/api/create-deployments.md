---
title: Create Deployments
---

# Create Deployments

Learn how to create a new deployment using either the Nosana HTTP API or the TypeScript SDK.

## Prerequisites

Before creating deployments, ensure you have:

- **API Key**: A valid Nosana API key. See the [API key guide](/api/get-api-key).
- **Credit Balance**: Sufficient credit balance on your Nosana account to run deployments.
- **Job Definition**: A valid [job definition](/deployments/jobs/job-definition/intro) describing the container workload. You can [validate it locally](/deployments/jobs/job-definition/validation) with the SDK before creating the deployment.

## What you configure

When creating a deployment, you specify:

- A unique **name** for your deployment
- The target **market** (GPU market address)
- Deployment configuration: **timeout**, **replicas**, **strategy**
- The **job definition** (container image, commands, operations)

For all available fields, see **[Deployment Options](/deployments/options)**. You can find GPU markets **[here](/deployments/gpu-markets)**.

## Create a Deployment

:::tabs

== TypeScript SDK

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

async function createDeployment() {
  const deployment = await client.api.deployments.create({
    name: 'Hello World',
    market: '7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq',
    timeout: 60, // minutes
    replicas: 1,
    strategy: 'SIMPLE',
    job_definition: {
      version: '0.1',
      type: 'container',
      meta: {
        trigger: 'api',
      },
      ops: [
        {
          type: 'container/run',
          id: 'hello-world',
          args: {
            cmd: 'for i in `seq 1 30`; do echo $i; sleep 1; done',
            image: 'ubuntu',
          },
        },
      ],
    },
  });
}
```

== HTTP API

```bash
export NOSANA_API_KEY="nos_xxx_your_api_key"

curl -X POST "https://api.nosana.com/deployments/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  -d '{
    "name": "Hello World",
    "market": "7AtiXMSH6R1jjBxrcYjehCkkSF7zvYWte63gwEDBcGHq",
    "timeout": 60,
    "replicas": 1,
    "strategy": "SIMPLE",
    "job_definition": {
      "version": "0.1",
      "type": "container",
      "meta": {
        "trigger": "api"
      },
      "ops": [
        {
          "type": "container/run",
          "id": "hello-world",
          "args": {
            "cmd": "for i in `seq 1 30`; do echo $i; sleep 1; done",
            "image": "ubuntu"
          }
        }
      ]
    }
  }'
```

:::

The response contains the created deployment, including its `id`, which you will need to start or manage it.

## Start a Deployment

New deployments are created in a **draft** state and must be explicitly started:

:::tabs

== TypeScript SDK

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
async function startDeployment(id: string) {
  const deployment = await client.api.deployments.get(id);
  await deployment.start();
}
```

== HTTP API

```bash
curl -s \
  -X POST \
  -H "Authorization: Bearer $NOSANA_API_KEY" \
  https://api.nosana.com/deployments/<deployment_id>/start | jq .
```

:::

Replace `<deployment_id>` with the `id` returned from the create call.
