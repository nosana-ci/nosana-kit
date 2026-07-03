---
title: Your First Job
---

# Your First Job via the API

This guide walks you through posting your first job on the Nosana Network, end to end: pick a GPU market, write and validate a job definition, upload it to IPFS, post the job with credits, and fetch the results.

Every step uses the `@nosana/kit` TypeScript SDK. For the raw HTTP equivalents of each call, see the [Jobs API reference](/api/jobs).

## Prerequisites

- **API key** — see [How to Get an API Key](/api/get-api-key)
- **Credits** — your account needs credits to pay for the job; check the [Credits API](/api/credits)
- **Node.js** — a recent LTS version

Install the SDK:

```bash
npm install @nosana/kit
```

## Step 1 — Initialize the client

Create a client for mainnet with your API key, and confirm you have credits to spend:

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

const balance = await client.api.credits.balance();
console.log('Available credits:', balance.assignedCredits - balance.reservedCredits - balance.settledCredits);
```

## Step 2 — Pick a market

Jobs run on a GPU market: a pool of hosts with a specific GPU type and hourly price. List the markets and pick one that fits your workload:

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const markets = await client.api.markets.list();

for (const market of markets) {
  console.log(`${market.name} (${market.address}) — ${market.vram}GB VRAM`);
}
```

Note the `address` of the market you want — you'll pass it when posting the job. See [Markets](/api/markets) for pricing and resource requirements. The examples below use the NVIDIA RTX 3090 market.

## Step 3 — Write and validate the job definition

A [job definition](/deployments/jobs/job-definition/intro) is a JSON document describing the container to run. Validate it locally before spending anything — the validator catches misspelled fields and schema mistakes:

```ts twoslash
import { validateJobDefinition } from '@nosana/kit';

const validation = validateJobDefinition({
  version: '0.1',
  type: 'container',
  meta: { trigger: 'api' },
  ops: [
    {
      type: 'container/run',
      id: 'hello-world',
      args: {
        cmd: 'echo hello world',
        image: 'ubuntu',
      },
    },
  ],
});

if (!validation.success) {
  throw new Error(
    validation.errors.map((e) => `${e.path}: expected ${e.expected}`).join('\n'),
  );
}

const jobDefinition = validation.data;
```

See [Validation](/deployments/jobs/job-definition/validation) for details on the validator.

## Step 4 — Upload the job definition to IPFS

Jobs reference their definition by IPFS hash. Pin the validated definition with the built-in IPFS service:

```ts twoslash
import { createNosanaClient, NosanaNetwork, validateJobDefinition } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
declare const jobDefinition: import('@nosana/kit').JobDefinition;
// ---cut---
const ipfsHash = await client.ipfs.pin(jobDefinition);

console.log('Job definition pinned:', ipfsHash);
```

## Step 5 — Post the job

Post the job to your chosen market, paid with credits. The `timeout` is the maximum runtime in seconds (default: 3600) — you're only charged for what the job actually uses:

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
declare const ipfsHash: string;
// ---cut---
const posted = await client.api.jobs.list({
  ipfsHash,
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  timeout: 600, // seconds
});

console.log('Job address:', posted.job);
console.log('Credits used:', posted.credits.creditsUsed);
```

For safe retries, pass an idempotency key — see [Idempotency](/api/jobs#idempotency).

## Step 6 — Wait for the job and fetch the results

Poll the job until its results land on IPFS, then retrieve them:

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
declare const posted: { job: string };
// ---cut---
let job = await client.api.jobs.get(posted.job);

// When the job finishes, its results are pinned to IPFS
while (!job.ipfsResult) {
  console.log('Waiting… current state:', job.state);
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  job = await client.api.jobs.get(posted.job);
}

const results = await client.ipfs.retrieve(job.ipfsResult);
console.log('Results:', JSON.stringify(results, null, 2));
```

## Step 7 — Extend or stop (optional)

While the job is running you can give it more time, or stop it early — the unused credits are refunded:

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
declare const posted: { job: string };
// ---cut---
// Add 10 more minutes
await client.api.jobs.extend({ address: posted.job, seconds: 600 });

// Or stop it early (remaining credits are refunded)
await client.api.jobs.stop(posted.job);
```

## Complete script

Everything above as one runnable script:

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork, validateJobDefinition } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// 1. Validate the job definition
const validation = validateJobDefinition({
  version: '0.1',
  type: 'container',
  meta: { trigger: 'api' },
  ops: [
    {
      type: 'container/run',
      id: 'hello-world',
      args: {
        cmd: 'echo hello world',
        image: 'ubuntu',
      },
    },
  ],
});
if (!validation.success) {
  throw new Error(
    validation.errors.map((e) => `${e.path}: expected ${e.expected}`).join('\n'),
  );
}

// 2. Pin it to IPFS
const ipfsHash = await client.ipfs.pin(validation.data);

// 3. Post the job with credits
const posted = await client.api.jobs.list({
  ipfsHash,
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  timeout: 600, // seconds
});
console.log('Job posted:', posted.job);

// 4. Wait for the results
let job = await client.api.jobs.get(posted.job);
while (!job.ipfsResult) {
  await new Promise((resolve) => setTimeout(resolve, 10_000));
  job = await client.api.jobs.get(posted.job);
}

// 5. Fetch and print the results
const results = await client.ipfs.retrieve(job.ipfsResult);
console.log(JSON.stringify(results, null, 2));
```

## Next steps

- **Run many instances with lifecycle management** — jobs are single execution units; for replicas, revisions, and scheduling use [Deployments](/api/create-deployments)
- **Post jobs in bulk** — see [Batch Operations](/api/jobs#batch-operations)
- **Make retries safe** — see [Idempotency](/api/jobs#idempotency)
- **Explore every endpoint** — see the [API Reference overview](/api/reference)
