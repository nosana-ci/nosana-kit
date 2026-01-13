---
title: Jobs
---

# Jobs API

The Jobs API allows you to manage individual jobs on the Nosana Network. Jobs are single execution units that can be posted directly using credits, without requiring a deployment.

## Overview

Jobs are different from deployments:
- **Jobs**: Single execution units, posted directly with credits using an IPFS hash
- **Deployments**: Orchestration layer that manages multiple job instances with strategies

Use the Jobs API when you need to:
- Post a one-time job execution using credits
- Get information about a specific job
- Extend a running job's execution time
- Stop a running job

## Get Job by Address

Retrieve information about a specific job:

:::tabs

== @nosana/kit

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

// Get job information
const job = await client.api.jobs.get('job-address-here');

console.log('Job State:', job.state);
console.log('Job Definition:', job.job_definition);
```

== HTTP API

```bash
curl -X GET https://dashboard.k8s.prd.nos.ci/api/jobs/{address} \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

:::

## Post Job

Post a job to the Nosana Network using credits. The job definition must be uploaded to IPFS first, and you provide the IPFS hash.

:::tabs

== @nosana/kit

```ts
// Post a job using credits
const job = await client.api.jobs.list({
  ipfsHash: 'QmYourJobDefinitionIPFSHash',
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  timeout: 60, // Optional: timeout in minutes
  node: 'node-address', // Optional: specific node to run on
});

console.log('Job Address:', job.address);
console.log('Job State:', job.state);
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/list \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "ipfsHash": "QmYourJobDefinitionIPFSHash",
    "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ",
    "timeout": 60
  }'
```

**Response:**
```json
{
  "tx": "transaction-signature",
  "job": "job-address-here",
  "run": "run-address-here",
  "credits": {
    "costUSD": 0.5,
    "creditsUsed": 100,
    "reservationId": "reservation-id",
    "project": "project-id"
  }
}
```

:::

### Job Definition on IPFS

Before posting a job, you need to upload your job definition to IPFS. You can use the Nosana IPFS service:

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

// Upload job definition to IPFS
const ipfsHash = await client.ipfs.add(jobDefinitionJson);

// Then post the job using the IPFS hash
const result = await client.api.jobs.list({
  ipfsHash: ipfsHash,
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
});

console.log('Job Address:', result.job);
console.log('Credits Used:', result.credits.creditsUsed);
```

:::

## Extend Job

Extend the execution time of a running job:

:::tabs

== @nosana/kit

```ts
// Extend job execution time
const result = await client.api.jobs.extend({
  address: 'job-address-here',
  timeout: 120, // Additional minutes
});
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/{address}/extend \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "timeout": 120
  }'
```

:::

## Stop Job

Stop a running job:

:::tabs

== @nosana/kit

```ts
// Stop a running job
const result = await client.api.jobs.stop('job-address-here');
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/{address}/stop \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

:::

## Job States

Jobs progress through the following states:

- `pending` - Job is queued and waiting to be scheduled
- `running` - Job is currently executing
- `completed` - Job finished successfully
- `failed` - Job encountered an error
- `stopped` - Job was manually stopped

## Posting vs Deployments

The Jobs API allows you to post individual jobs using credits. For more advanced use cases with orchestration, scheduling, and lifecycle management, use [Deployments](/api/create-deployments) instead.

