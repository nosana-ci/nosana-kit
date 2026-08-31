# One-shot jobs

The lower-level path: post a single job directly, paid with credits. **Prefer
deployments.** Reach for this only when you specifically want no lifecycle
management.

| | Deployment | One-shot job |
|---|---|---|
| Replicas, revisions, restarts | ✅ | ✗ |
| Scheduling, strategies | ✅ | ✗ |
| Endpoint URLs handed to you | ✅ | ✗ (derive from the hash) |
| SSE stream | ✅ | ✗ (poll) |
| Job definition | inline | must be pinned to IPFS first |
| `timeout` unit | **minutes** | **seconds** |

Use one-shot jobs for: fire-and-forget batch work, posting thousands of jobs
cheaply via batch, or when you're managing lifecycle yourself.

## Full flow

```ts
import { createNosanaClient, NosanaNetwork, validateJobDefinition } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// 1. validate
const v = validateJobDefinition(jobDefinitionJson);
if (!v.success) throw new Error(v.errors.map((e) => `${e.path}: ${e.expected}`).join('\n'));

// 2. pin to IPFS
const ipfsHash = await client.ipfs.pin(v.data);

// 3. post — timeout in SECONDS, default 3600
const posted = await client.api.jobs.list({
  ipfsHash,
  market: '97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf',
  timeout: 600,
  // node: '<address>'  // optional: pin to a specific host
});
posted.job;                  // job address
posted.credits.creditsUsed;

// 4. poll for results
let job = await client.api.jobs.get(posted.job);
while (!job.ipfsResult) {
  await new Promise((r) => setTimeout(r, 10_000));
  job = await client.api.jobs.get(posted.job);
}

// 5. retrieve
const results = await client.ipfs.retrieve(job.ipfsResult);
```

You are only charged for time actually used.

## IPFS

```ts
await client.ipfs.pin(object);       // → CID
await client.ipfs.pinFile(path);     // → CID
await client.ipfs.retrieve(cid);
```

## Job fields

`get()` returns the indexed on-chain job:

| Field | Notes |
|---|---|
| `state` | **Numeric**: `0` QUEUED, `1` RUNNING, `2` COMPLETED, `3` STOPPED |
| `ipfsJob` / `ipfsResult` | Definition CID / results CID (`null` until done) |
| `market`, `node`, `payer`, `project` | Addresses |
| `price`, `usdRewardPerHour` | Pricing |
| `timeStart`, `timeEnd`, `timeout`, `listedAt` | Epoch seconds |

Import `JobState` from `@nosana/kit` rather than hard-coding the numbers.

## Extend and stop

```ts
await client.api.jobs.extend({ address: posted.job, seconds: 600 });
await client.api.jobs.stop(posted.job); // unused credits refunded
```

Both are no-ops on an already-finished job — `tx` is `null`, nothing charged.

## Batch

One request, fewest transactions. **An idempotency key is required.**

```ts
import { generateIdempotencyKey } from '@nosana/kit';

const res = await client.api.jobs.listBatch(
  { jobs: [
      { ipfsHash: 'QmA', market, timeout: 3600 },
      { ipfsHash: 'QmB', market },
  ] },
  { idempotencyKey: generateIdempotencyKey() },
);

const expired = res.items.filter((i) => i.status === 'expired');
// re-post only these, under a FRESH key
```

Also `extendBatch({ jobs: [{ jobAddress, seconds }] })` and
`stopBatch({ jobs: [{ jobAddress }] })`. See errors.md for the result contract.

## Queries

```ts
await client.api.jobs.getAll({ /* filters */ });
await client.api.jobs.getBatch({ addresses: [posted.job] });
await client.api.jobs.getCount();
await client.api.jobs.getRunning();
await client.api.jobs.getLongRunning();
await client.api.jobs.getStats();
```

## Endpoints for one-shot jobs

No `endpoints` array here. Derive it:

```ts
import { getJobExposedServices } from '@nosana/kit';

const services = getJobExposedServices(jobDefinition, posted.job);
// → [{ hash, opIndex, opId, port, hasHealthCheck }]
const url = `https://${services[0].hash}.node.k8s.prd.nos.ci`;
```

## On-chain, without credits

`client.jobs` posts jobs directly against the Solana program, paying in NOS from
your wallet rather than credits. It returns an instruction you submit yourself:

```ts
import { address, loadWalletFromFile } from '@nosana/kit';

client.wallet = await loadWalletFromFile();
const ix = await client.jobs.post({
  market: address(marketAddress), // client.jobs takes branded Address, not string
  timeout: 7200,                  // SECONDS
  ipfsHash,
});
const sig = await client.solana.buildSignAndSend(ix);
```

Also available: `client.jobs.get/all/run/runs/market/markets`, plus
`client.stake` and `client.merkleDistributor`. This is the protocol layer — most
callers should stay on `client.api`.
