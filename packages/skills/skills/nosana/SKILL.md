---
name: nosana
description: Deploy and monitor GPU workloads on the Nosana network with @nosana/kit. Use when creating, starting, monitoring, debugging, or tearing down a Nosana deployment; writing or validating a job definition; picking a GPU market; reaching a deployed service's endpoint; reading deployment logs; or handling credits, vaults, and Nosana API errors.
license: MIT
---

# Nosana

Nosana runs containerized GPU workloads on a decentralized network. You describe
the container as a **job definition**, pick a **GPU market**, and create a
**deployment** that schedules it onto hosts.

**Use deployments, not one-shot jobs.** Deployments own the lifecycle: replicas,
revisions, restarts, scheduling, streaming, and endpoint URLs. One-shot jobs are
a lower-level path — see [reference/one-shot-jobs.md](reference/one-shot-jobs.md).

## Setup

```bash
npm install @nosana/kit   # Node >= 20.18.0
```

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
import type { NosanaClient } from '@nosana/kit'; // the client type is exported — don't re-derive it

const client: NosanaClient = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
```

Networks: `MAINNET` (default), `DEVNET`, `LOCALNET`. `@nosana/kit` re-exports
`@nosana/api`, `@nosana/types`, `@nosana/ipfs` and the Solana clients — install
only `@nosana/kit`.

### Two auth modes — this changes the API surface

| Mode | Setup | Pays with | Deployments have |
|---|---|---|---|
| **API key** | `{ api: { apiKey } }` | account credits | no vault |
| **Wallet** | `client.wallet = await loadWalletFromFile()`, no apiKey | SOL/NOS in a vault | `deployment.vault` |

API keys come from [deploy.nosana.com](https://deploy.nosana.com) → Account → API
Keys, and look like `nos_…`. Read from the environment, never commit.

With a wallet, cast to get the signer variant:

```ts
import type { NosanaApi } from '@nosana/kit';
const api = client.api as NosanaApi; // deployments carry a vault
```

See [reference/funding.md](reference/funding.md) for credits and vaults.

## Deploy

```ts
const deployment = await client.api.deployments.create({
  name: 'my-service',
  market: '97G9NnvBDQ2WpKu6fasoMsAKmfj63C9rhysJnkeWodAf', // NVIDIA 4090
  replicas: 1,
  timeout: 60,          // MINUTES (jobs API uses seconds — see Gotchas)
  strategy: 'SIMPLE',
  autostart: true,      // skip the DRAFT state
  job_definition: {
    version: '0.1',
    type: 'container',
    meta: { trigger: 'api' },
    ops: [
      {
        type: 'container/run',
        id: 'server',
        args: { image: 'nginx', expose: 80 },
      },
    ],
  },
});

console.log(deployment.id, deployment.status);
```

Without `autostart`, a deployment is created as `DRAFT` and does nothing until
you call `await deployment.start()`.

### Create options

| Field | Notes |
|---|---|
| `name`, `market`, `replicas` | Required. Market is a Solana address — see [reference/markets.md](reference/markets.md) |
| `timeout` | **Minutes**. Schema min is 1, but **credit-paid (API key) deployments require ≥ 60** — below that the create succeeds and every job listing fails. `INFINITE` requires ≥ 60 too |
| `strategy` | `SIMPLE`, `SIMPLE-EXTEND`, `SCHEDULED` (needs `schedule` cron), `INFINITE` (optional `rotation_time` seconds, ≥10 min under `timeout`) |
| `job_definition` | See [reference/job-definition.md](reference/job-definition.md) |
| `autostart` | Start immediately instead of `DRAFT` |
| `confidential` | Confidential compute |
| `vault` / `new_vault` | Wallet auth: reuse a vault address, or force a fresh one. Default reuses your oldest shared vault |

Strategies: `SIMPLE` runs replicas once. `SIMPLE-EXTEND` keeps extending them
until funds run out. `SCHEDULED` runs them on a cron. `INFINITE` maintains
replicas continuously, rotating jobs before timeout.

**Validate the job definition before spending anything:**

```ts
import { validateJobDefinition } from '@nosana/kit';

const result = validateJobDefinition(jobDefinitionJson);
if (!result.success) {
  throw new Error(result.errors.map((e) => `${e.path}: expected ${e.expected}`).join('\n'));
}
```

### Lifecycle

```ts
await deployment.start();
await deployment.stop();
await deployment.archive();          // hide, keep history
await deployment.delete();           // permanent; must be STOPPED first

await deployment.updateReplicaCount(3);
await deployment.updateTimeout(120); // minutes
await deployment.updateSchedule('0 0 * * *');
await deployment.updateName('new-name');
await deployment.updateMarket('MARKET_ADDRESS'); // running jobs are relisted on the new market
await deployment.createRevision(newJobDefinition);
await deployment.updateActiveRevision(2);

// Copy a deployment (same vault, market, strategy, active revision); source is untouched.
// The copy is a full deployment object, so drive it like any other:
const copy = await deployment.duplicate({ name: 'my-copy' });
await copy.start(); // or pass { autostart: true } to skip this
```

`delete()` leaves the vault intact and makes the deployment object unusable.

## Monitor

The main event. Ordered by usefulness.

### 1. Endpoint URLs — the API gives them to you

```ts
const d = await client.api.deployments.get(id);
for (const { opId, port, url, online } of d.endpoints) {
  console.log(opId, port, url, online); // https://<hash>.node.k8s.prd.nos.ci
}
```

Do **not** derive these by hashing, and do **not** poll the URL to find out
whether it is up — `online` already says so.

The URL is populated at create time, before anything is scheduled, so its
presence means nothing. `online` is the readiness signal: it is true once the
node's tunnel is registered, and when the op declares an http health check the
tunnel only registers after that check passes — so it means the service
answered, not merely that a port opened.

Three states, from one response — `active_jobs` is on the same deployment:

| `active_jobs` | `online` | Means |
|---|---|---|
| `> 0` | `false` | **starting** — scheduled, not serving yet |
| any | `true` | **up** — the URL serves |
| `0` | `false` | **not running** |

`online` is per `opId`: every port an op exposes shares one tunnel and reports
together. See [reference/endpoints.md](reference/endpoints.md).

### 2. Stream — live changes over SSE

```ts
const sub = deployment.stream({
  onDeployment: (e) => console.log('status', e.status, 'replicas', e.replicas),
  onJob:        (e) => console.log('job', e.job, e.state, 'node', e.node),
  onEvent:      (e) => console.log('[event]', e.event, e.message),
  onTask:       (e) => console.log('task', e.task, e.status),
  onEndpoint:   (e) => console.log('endpoint', e.opId, e.port, 'online=' + e.online),
  onOpen:       () => console.log('resync'),
  onError:      (err) => console.error(err),
});

// later
sub.close();
```

`onEndpoint` is how you wait for a service without polling it: every endpoint is
stated once when the stream opens, then again whenever its reachability changes.

Four semantics that will bite you if you assume otherwise:

- **`onOpen` means "resynchronise from here", not "started".** `EventSource`
  reconnects on its own and the server replays the opening snapshot each time,
  so `onOpen` fires again after any drop. Rebuild state on every `onOpen`;
  don't append.
- **Errors are reported, never thrown.** The stream keeps retrying. Logging and
  bailing on the first `onError` loses the signal permanently.
- **Malformed frames are silently dropped**, as is anything a handler throws.
  Don't rely on a handler's exception surfacing.
- **A frame per endpoint, not per change.** An op exposing several ports emits
  one frame per entry, all carrying the same `online`, because they share a
  tunnel. Key your state on `opId` + `port`.

### 3. Status — the state machine

| Status | Meaning |
|---|---|
| `DRAFT` | Created, never started |
| `STARTING` | Scheduling jobs onto hosts |
| `RUNNING` | The deployment is trying to keep jobs listed — **not** proof any job runs. Check `active_jobs` and `getEvents()` |
| `STOPPING` → `STOPPED` | Winding down / done |
| `ERROR` | Failed |
| `INSUFFICIENT_FUNDS` | Out of credits or vault balance — top up, then start |
| `ARCHIVED` | Hidden from the active list |

`STARTING` → `RUNNING` is not instant, and `RUNNING` does not mean the service
answers: the host still pulls the image and boots the container. Measured on a
bare `nginx`, that took 21s, 35s, 80s and 216s across four runs of the same job
definition — budget minutes, not seconds. Watch `endpoints[].online` rather than
timing it, and declare a health check on the exposed port so the tunnel only
registers once the service replies.

But a deployment can also sit in `RUNNING` **forever with zero jobs**, endpoint
503-ing, while job listing fails on a loop. Status never changes; the only
signal is in the event log. So when an endpoint doesn't come up, check
`getEvents()` before you wait — a `JOB_LIST_ERROR` there is the real answer.

### 4. Logs — the answer to "why did it die"

Container output lives on the **job**, not the deployment:

```ts
const { jobs } = await deployment.getJobs();

for (const j of jobs) {
  const job = await deployment.getJob(j.job);
  for (const op of job.jobResult?.opStates ?? []) {
    console.log(op.operationId, 'exit', op.exitCode);
    for (const line of op.logs ?? []) {
      console.log(`[${line.type}]`, line.log); // stdout | stderr | stdin | nodeerr
    }
  }
}
```

`jobResult` is `null` until the job produces results. `op.error` holds the
failure reason, `op.results` holds values extracted by the job definition's
`results` regexes.

### Events, tasks, revisions

```ts
const { events }    = await deployment.getEvents();    // audit log: what happened, with tx
const { tasks }     = await deployment.getTasks();     // scheduled LIST/EXTEND/STOP work
const { revisions } = await deployment.getRevisions(); // job definition history
```

All four listings (`getJobs`, `getEvents`, `getTasks`, `getRevisions`) are
cursor-paginated and return `nextPage()` / `previousPage()` — `null` at the end:

```ts
let page = await deployment.getEvents({ limit: 50 });
while (page.nextPage) page = await page.nextPage();
```

Full frame and status tables: [reference/monitoring.md](reference/monitoring.md).

## Troubleshooting

| Symptom | Look here |
|---|---|
| Stuck in `STARTING` | Image pull / model download. `getEvents()`, then host logs via `getJob()` |
| `INSUFFICIENT_FUNDS` | [reference/funding.md](reference/funding.md) |
| Endpoint 404s/503s | **`getEvents()` first** — a repeating `JOB_LIST_ERROR` means nothing was ever scheduled. Otherwise still booting, or `expose` missing. [reference/endpoints.md](reference/endpoints.md) |
| `RUNNING` but `active_jobs: 0` | Job listing is failing. `getEvents()` |
| Container exits immediately | `getJob().jobResult.opStates[].exitCode` and `logs` |
| Create rejected | Run `validateJobDefinition` — the API's error is terser |
| `state` is a number, not a string | See Gotchas |
| Retrying a write safely | [reference/errors.md](reference/errors.md) |

## Gotchas

Things that will trip you up. Several of these contradict the published docs;
where they do, these were checked against the shipped types and the live API.

1. **`timeout` units differ.** Deployments: **minutes**. Jobs API and on-chain
   `post`: **seconds**. Nothing warns you; a 60 becomes an hour or a minute.
2. **Job `state` has three encodings.** Blockchain indexer returns `0|1|2|3`
   (`QUEUED|RUNNING|COMPLETED|STOPPED`, exported as `JobState`). The deployment
   stream returns the string union. `deployment.getJob()` is typed
   `string | number`. Normalise on read.
3. **Two ways in over HTTP.** Calling directly, use the gateway at
   `https://api.nosana.com` — one host, every route, and a merged
   OpenAPI spec (see below). The SDK instead calls the four services behind it
   directly — `client-manager` (auth, credits, templates, job writes),
   `blockchain-indexer` (job reads, stats), `deployment-manager` (deployments,
   vaults), `host-manager` (markets, hosts) — because its types are generated
   per service. Both work; the gateway is the simpler target for anything that
   isn't the SDK.
4. **Live market fields** are `usd_reward_per_hour`, `nos_job_price_per_second`,
   `slug`, `type`. There is no `vram` or `price_per_hour_usd` despite the docs.
5. **`INFINITE` is live**, not "coming soon".
6. **Curated methods throw; raw clients don't.** `client.api.*` throws on
   failure. `client.api.clients.*` returns `{ data, error }`.
7. **Health checks require `continuous`.** Every entry in `health_checks` needs
   a `continuous` boolean; the docs omit it. See
   [reference/endpoints.md](reference/endpoints.md).
8. **`meta` resource hints are advisory.** Whether you write `system_resources`
   (the declared field) or `system_requirements` (what the docs and examples
   use, accepted via an index signature), it only *indicates* what a workload
   needs — nothing enforces it. Pick a market whose GPU actually fits.
9. **Credit-paid deployments need `timeout` ≥ 60 minutes.** Anything less is
   accepted at create, then fails on every job listing with
   `Credit-paid jobs must have a timeout of at least 3600 seconds`, while the
   deployment happily reports `RUNNING`.

## Reference

Load only what the task needs.

| File | Contents |
|---|---|
| [reference/monitoring.md](reference/monitoring.md) | Stream frames, status transitions, logs, events, tasks, pagination |
| [reference/job-definition.md](reference/job-definition.md) | Full schema, ops, `cmd` forms, global defaults, literal interpolation |
| [reference/markets.md](reference/markets.md) | Choosing a GPU, live field names, current market addresses |
| [reference/endpoints.md](reference/endpoints.md) | Exposing ports, health checks, service URLs, multi-service containers |
| [reference/resources.md](reference/resources.md) | HuggingFace and S3 resources, caching, private registries |
| [reference/funding.md](reference/funding.md) | Credits (API key) and vaults (wallet) |
| [reference/errors.md](reference/errors.md) | Error types, idempotency keys, retry policy |
| [reference/one-shot-jobs.md](reference/one-shot-jobs.md) | Jobs API, batch operations, and when to prefer it |

## The HTTP API

Every route across all four services is published as one merged OpenAPI 3.1
spec, so you don't need to know which service owns what:

| | |
|---|---|
| Spec | `https://api.nosana.com/api/openapi.json` |
| Browsable | `https://api.nosana.com/api/docs` |

Routes answer both with and without the `/api` prefix
(`/markets/` and `/api/markets/` are the same route); the spec and its docs UI
are only under `/api`. The older `dashboard.k8s.prd.nos.ci/api` host still
answers, but `api.nosana.com` is what the docs now use.

Read the spec when you need a route this skill doesn't cover, an exact request
or response shape, or a query parameter — it is generated from the running
services, so it is more current than any prose, including this file. It
regenerates on a short interval, so a route added minutes ago may not be in it
yet.

From TypeScript, prefer the SDK. Anything without a curated method is still
reachable and typed via
`client.api.clients.{clientManager,hostManager,blockchainIndexer,deploymentManager}`
— see [reference/errors.md](reference/errors.md) for how those differ from
curated methods.
