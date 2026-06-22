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

## Idempotency

The **Post**, **Extend**, and **Stop** operations accept an optional idempotency
key. When you provide one, it is sent as the `Idempotency-Key` request header and
the API de-duplicates retried requests that share the same key — so a network
retry won't create a second job or apply an action twice.

The key is completely optional: omitting it leaves request behaviour unchanged.
Generate a unique value per logical operation and **reuse the same value when you
retry that operation** — a different key per attempt provides no de-duplication.

The SDK ships a `generateIdempotencyKey()` helper (a UUID generator that works in
Node and the browser) so you don't have to reach for `crypto` yourself.

:::tabs

== @nosana/kit

Pass an `idempotencyKey` in the options object (the last argument):

```ts
import { generateIdempotencyKey } from '@nosana/kit';

const key = generateIdempotencyKey();

const result = await client.api.jobs.list(
  {
    ipfsHash: 'QmYourJobDefinitionIPFSHash',
    market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  },
  { idempotencyKey: key },
);

// Retrying the SAME operation? Pass the SAME key so it is de-duplicated:
await client.api.jobs.list(
  {
    ipfsHash: 'QmYourJobDefinitionIPFSHash',
    market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  },
  { idempotencyKey: key },
);
```

== HTTP API

Send the `Idempotency-Key` header:

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/list \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
  -H "Content-Type: application/json" \
  -d '{
    "ipfsHash": "QmYourJobDefinitionIPFSHash",
    "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ"
  }'
```

:::

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
const job = await client.api.jobs.list(
  {
    ipfsHash: 'QmYourJobDefinitionIPFSHash',
    market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
    timeout: 60, // Optional: timeout in minutes
    node: 'node-address', // Optional: specific node to run on
  },
  // Optional: see the "Idempotency" section above.
  { idempotencyKey: generateIdempotencyKey() },
);

console.log('Job Address:', job.job);
```

== HTTP API

```bash
# The Idempotency-Key header is optional.
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/list \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
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
const result = await client.api.jobs.extend(
  {
    address: 'job-address-here',
    seconds: 3600, // Additional seconds
  },
  // Optional: see the "Idempotency" section above.
  { idempotencyKey: generateIdempotencyKey() },
);
```

== HTTP API

```bash
# The Idempotency-Key header is optional.
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/{address}/extend \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
  -H "Content-Type: application/json" \
  -d '{
    "seconds": 3600
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

// Optionally pass an idempotency key (see the "Idempotency" section above):
const stopped = await client.api.jobs.stop('job-address-here', {
  idempotencyKey: generateIdempotencyKey(),
});
```

== HTTP API

```bash
# The Idempotency-Key header is optional.
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/{address}/stop \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11"
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

