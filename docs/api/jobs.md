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

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
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

### Control responses

A rejected request throws a `NosanaApiError`. `error.statusCode` is always set,
and `error.retryAfter` (seconds) is populated from `Retry-After` when present.

The key distinction is **`code`, not the HTTP status**: a `409` that carries a
machine-readable `code` is a *control signal* (retry / fresh-key / fatal); any
error **without** a `code` is an ordinary rejection. Use `isIdempotencyControlSignal`
to make that split, then branch on the exported `IdempotencyCode` constants —
*what* each code means for your retry policy is up to you.

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateIdempotencyKey } from '@nosana/kit';
import type { NosanaApiListJobRequest } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
declare const request: NosanaApiListJobRequest;
const key = generateIdempotencyKey();
// ---cut---
import { IdempotencyCode, isIdempotencyControlSignal } from '@nosana/kit';

try {
  await client.api.jobs.list(request, { idempotencyKey: key });
} catch (error) {
  if (!isIdempotencyControlSignal(error)) throw error; // ordinary error or network failure

  switch (error.code) {
    case IdempotencyCode.IN_PROGRESS:
      // A matching request is still in flight — retry the SAME key later.
      // error.retryAfter holds the suggested delay in seconds, when provided.
      break;
    case IdempotencyCode.EXPIRED:
      // The prepared transaction is dead — re-post with a fresh key.
      break;
    case IdempotencyCode.PAYLOAD_MISMATCH:
      // Same key reused with a different payload — do not retry.
      break;
  }
}
```

## Get Job by Address

Retrieve information about a specific job:

:::tabs

== @nosana/kit

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

// Get job information
const job = await client.api.jobs.get('job-address-here');

console.log('Job State:', job.state);
console.log('Node:', job.node);
console.log('Job Definition IPFS hash:', job.ipfsJob);
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

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateIdempotencyKey } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
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

```ts twoslash
import type { JobDefinition } from '@nosana/kit';
declare const process: { env: Record<string, string> };
declare const jobDefinitionJson: JobDefinition;
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

// Upload (pin) the job definition to IPFS
const ipfsHash = await client.ipfs.pin(jobDefinitionJson);

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

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateIdempotencyKey } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// Extend job execution time
const result = await client.api.jobs.extend(
  {
    address: 'job-address-here',
    seconds: 3600, // Additional seconds
  },
  // Optional: see the "Idempotency" section above.
  { idempotencyKey: generateIdempotencyKey() },
);

// `tx` is null (and `credits` is omitted) when the job was already terminal —
// a confirmed no-op, nothing was charged. Extending a terminal job never errors.
if (result.tx === null) {
  // already finished — nothing to do
}
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

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateIdempotencyKey } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
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

## Batch Operations

Post, extend, or stop **many jobs in one request**, packed into the fewest
transactions. Unlike the single-job calls, batch endpoints **require** an
`Idempotency-Key` header (one key per batch) — the request is rejected with
`400` if it is missing.

Every batch returns per-item results addressed by request `index`:

```json
{
  "items": [
    { "index": 0, "status": "confirmed", "job": "job-address", "run": "run-address", "tx": "tx-signature" },
    { "index": 1, "status": "expired" }
  ]
}
```

- `confirmed` — the item landed (its `job`/`run` are included for posts).
- `expired` — the item did not land; **re-post only those items under a fresh key**.
- `tx` — the on-chain signature, useful for tracing. Items packed into the same
  transaction share one `tx`; it's absent on `expired` items and on already-terminal
  no-ops (extend/stop of a finished job, where nothing is sent).

If a batch is still confirming you'll get a `409 IDEMPOTENCY_KEY_IN_PROGRESS` —
retry with the **same** batch key; items that already landed stay landed. See
[Control responses](#control-responses) for the error contract.

### Batch Post

:::tabs

== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
import { generateIdempotencyKey } from '@nosana/kit';

const result = await client.api.jobs.listBatch(
  {
    jobs: [
      { ipfsHash: 'QmJobDefinitionA', market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ', timeout: 3600 },
      { ipfsHash: 'QmJobDefinitionB', market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ' },
    ],
  },
  { idempotencyKey: generateIdempotencyKey() }, // required
);

const expired = result.items.filter((i) => i.status === 'expired');
// re-post `expired` under a fresh key
```

== HTTP API

```bash
# The Idempotency-Key header is REQUIRED for batch endpoints (400 if omitted).
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/list/batch \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      { "ipfsHash": "QmJobDefinitionA", "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ", "timeout": 3600 },
      { "ipfsHash": "QmJobDefinitionB", "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ" }
    ]
  }'
```

:::

### Batch Extend

:::tabs

== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateIdempotencyKey } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const result = await client.api.jobs.extendBatch(
  {
    jobs: [
      { jobAddress: 'job-address-1', seconds: 3600 },
      { jobAddress: 'job-address-2', seconds: 600 },
    ],
  },
  { idempotencyKey: generateIdempotencyKey() }, // required
);
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/extend/batch \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      { "jobAddress": "job-address-1", "seconds": 3600 },
      { "jobAddress": "job-address-2", "seconds": 600 }
    ]
  }'
```

:::

### Batch Stop

:::tabs

== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork, generateIdempotencyKey } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const result = await client.api.jobs.stopBatch(
  { jobs: [{ jobAddress: 'job-address-1' }, { jobAddress: 'job-address-2' }] },
  { idempotencyKey: generateIdempotencyKey() }, // required
);
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/jobs/stop/batch \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      { "jobAddress": "job-address-1" },
      { "jobAddress": "job-address-2" }
    ]
  }'
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

