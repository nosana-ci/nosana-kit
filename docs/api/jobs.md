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
curl -X POST https://api.nosana.com/jobs/list \
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

// The node job API rides on the same object — no extra fetch, no local wallet.

// Stream task logs (history first, then live). `logs()` returns a subscription;
// call close() when you're done.
const logs = job.logs({
  onData: (log) => console.log(`[${log.opId}]`, log.message),
  onError: (err) => console.error('log stream error:', err),
});
// …later
logs.close();

// Connect over SSH: authorize a public key, then print the ready-to-run command.
await job.ssh.add('ssh-ed25519 AAAA... you@laptop');
const ssh = job.ssh.command({ identityFile: '~/.ssh/id_ed25519' });
console.log(ssh.formattedCommand);
```

== HTTP API

```bash
curl -X GET https://api.nosana.com/jobs/{address} \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

:::

The returned job merges the indexer state (`state`, `node`, `ipfsJob`, …) with
the live node job API, so `definition()`, `results()`, `logs()`, `ssh` and
`terminal()` all live on the one object. The node calls are authorized on your
behalf (signer, API key, or a browser session), so they work without a local
wallet; under unauthenticated public access the shape is identical but those
node calls will fail.

## Manage an Active Job

Once a job is running, the object returned by `jobs.get(id)` exposes the node's
live job API — inspect its operations, stream stats, restart or stop individual
operations, collect results, or open an interactive terminal. These reach the
node directly and require an authenticated client, so they are SDK-only.

With an API key or an app's token, the SDK signs these node requests through your
account, which needs the `wallet:sign` [permission](/api/scopes). To read job data with a
narrower key, use [Read Job Data](#read-job-data) instead.

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
const job = await client.api.jobs.get('job-address-here');

// Inspect the job's operations and the endpoints it exposes.
console.log('Operations:', await job.operations());
console.log('Endpoints:', await job.endpoints());

// Stream resource stats (CPU / memory / …) as the node samples them.
const stats = job.streamStats(
  { onData: (samples) => console.log('stats:', samples) },
  { interval: 5 },
);
// …later
stats.close();

// Restart or stop a single operation within a group.
await job.restartOperation('default', 'my-op');
await job.stopOperation('default', 'my-op');

// Stop the whole job.
await job.stop();

// Once finished, collect the flow results (the node hands them over once).
console.log('Results:', await job.results());
```

### Open an Interactive Terminal

Attach a PTY to the running job. The node streams output through `onData`; write
back with `sendInput`, resize with `resize`, and end the session with `close`.

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
const job = await client.api.jobs.get('job-address-here');
// ---cut---
const terminal = await job.terminal({
  cols: 80,
  rows: 24,
  onData: (bytes) => console.log(new TextDecoder().decode(bytes)),
  onStatus: (status) => console.log('terminal:', status),
});

terminal.sendInput('ls -la\n');
terminal.resize(120, 40);
terminal.close();
```

## Read Job Data

With the `jobs:read` [permission](/api/scopes), you can read a running job's data from its
node over plain HTTP. Nosana signs the request to the node for you, so the key doesn't
need `wallet:sign`, and it can't change the job.

```bash
curl https://api.nosana.com/jobs/{address}/node/ops \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

| Path | Returns |
|---|---|
| `GET /jobs/{address}/node/info` | A live stream (server-sent events) of the job's state and task status, until the job ends |
| `GET /jobs/{address}/node/job-definition` | The job definition the node is running |
| `GET /jobs/{address}/node/endpoints` | The URLs the job exposes, and whether they answer yet |
| `GET /jobs/{address}/node/stats` | CPU, memory, disk and network samples. Accepts `interval`, `start` and `end` |
| `GET /jobs/{address}/node/ops` | The status of every operation |
| `GET /jobs/{address}/node/ops/{opId}` | The status of one operation |
| `GET /jobs/{address}/node/group/current` | The status of the operations in the group that's running |
| `GET /jobs/{address}/node/group/{group}` | The status of the operations in one group |
| `GET /jobs/{address}/node/results` | The finished flow state |

:::warning
`results` is only available once the job is waiting for its results to be collected, and
reading it lets the node finish the job. Don't call it just to check on a running job.
:::

Only jobs posted from your account can be read, including your deployments' jobs.

| Status | Meaning |
|---|---|
| `404` | No job with that address, or it wasn't posted from your account |
| `409` | The job hasn't been picked up by a node yet |
| `502` | The node running the job couldn't be reached |

Any other status comes from the node itself, for example a `400` when a resource isn't
available in the job's current state.

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
    timeout: 600, // Optional: max runtime in seconds (default: 3600)
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
curl -X POST https://api.nosana.com/jobs/list \
  -H "Authorization: Bearer nos_xxx_your_api_key" \
  -H "Idempotency-Key: 0f8c1e9a-7b2d-4c3e-9f1a-2b6d8e4f0a11" \
  -H "Content-Type: application/json" \
  -d '{
    "ipfsHash": "QmYourJobDefinitionIPFSHash",
    "market": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ",
    "timeout": 600
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

Before posting a job, you need to upload your job definition to IPFS. You can use the Nosana IPFS service. It's a good idea to [validate the job definition](/deployments/jobs/job-definition/validation) first — it catches schema mistakes before you upload or spend credits:

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
curl -X POST https://api.nosana.com/jobs/{address}/extend \
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
curl -X POST https://api.nosana.com/jobs/{address}/stop \
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
curl -X POST https://api.nosana.com/jobs/list/batch \
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
curl -X POST https://api.nosana.com/jobs/extend/batch \
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
curl -X POST https://api.nosana.com/jobs/stop/batch \
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

