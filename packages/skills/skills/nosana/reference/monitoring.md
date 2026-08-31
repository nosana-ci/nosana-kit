# Monitoring a deployment

## Stream frames

`deployment.stream(handlers)` returns `{ close }`. Every frame arrives as an
unnamed SSE `message` discriminated by `type` — not by the SSE `event:` line.

### `deployment`
```ts
{ type: 'deployment', status: DeploymentStatus, replicas: number, active_revision: number }
```

### `job`
```ts
{ type: 'job', job: string, state: 'QUEUED'|'RUNNING'|'COMPLETED'|'STOPPED',
  node: string | null, timeStart: number, timeEnd: number }
```

### `endpoint`
```ts
{ type: 'endpoint', opId: string, port: number | string, url: string, online: boolean }
```
The endpoint exactly as the deployment routes return it. Every endpoint is stated
when the stream opens, then restated whenever reachability changes — so an op
exposing several ports emits one frame per entry, all with the same `online`.

### `event`
```ts
{ type: 'event', category: 'Deployment'|'Event', event: string,
  message: string, tx: string | null, created_at: string }
```

### `task`
Two shapes, split on `status`:
```ts
{ type: 'task', id, task: 'LIST'|'EXTEND'|'STOP',
  status: 'PENDING'|'PROCESSING', attempts: number, due_at: string, job: string | null }
{ type: 'task', id, task: 'LIST'|'EXTEND'|'STOP', status: 'DONE' }
```

Narrow a single frame type with `DeploymentStreamEventOf<'job'>`.

### Behaviour

- The stream opens with a snapshot: the deployment, its active jobs, its
  outstanding tasks. Then it emits changes.
- `EventSource` reconnects itself and the server **replays the snapshot** each
  time. `onOpen` therefore means *resynchronise*, and fires more than once.
  Rebuild state on it rather than appending.
- Nothing is resumed client-side. There is no cursor or replay-from-id.
- Errors go to `onError` and the stream keeps retrying. Never tear down on the
  first error.
- Frames that fail to parse are dropped silently, and so is any exception thrown
  inside a handler.
- Under cookie auth the stream opts into sending credentials; under API-key auth
  the header is attached per request. Both are handled for you.

## Status transitions

```
DRAFT ──start()──> STARTING ──> RUNNING ──stop()──> STOPPING ──> STOPPED
                       │            │                              │
                       └──> ERROR   └──> INSUFFICIENT_FUNDS        └──archive()──> ARCHIVED
```

- `DRAFT` — created without `autostart`. Nothing is scheduled.
- `STARTING` — jobs are being listed onto the market and picked up by hosts.
  Includes image pull and any resource download; minutes is normal.
- `RUNNING` — the deployment is trying to keep `replicas` jobs listed. It does
  **not** mean a job is running, and it does **not** mean your service answers.
  A deployment whose job listing fails every time stays `RUNNING` indefinitely
  with `active_jobs: 0`. Cross-check `active_jobs` and `getEvents()`.
- `INSUFFICIENT_FUNDS` — credits exhausted or vault empty. Top up, then `start()`.
- `ERROR` — check `getEvents()` first, then per-job logs.
- `STOPPED` — required before `delete()`.
- `ARCHIVED` — removed from the active list, history retained.

## Polling instead of streaming

Streaming is preferred, but a poll loop is fine for short scripts:

```ts
let d = await client.api.deployments.get(id);
while (d.status === 'STARTING') {
  await new Promise((r) => setTimeout(r, 5_000));
  d = await client.api.deployments.get(id);
}
```

Poll no faster than a few seconds. `deployment` objects are snapshots — re-`get`
to refresh; the object does not update itself.

## Logs

Logs hang off the job's result, not the deployment.

```ts
const job = await deployment.getJob(jobAddress);

job.jobResult;            // JobResults | null — null until results are posted
job.jobResult?.status;
job.jobResult?.opStates;  // one entry per operation in the job definition
```

Each `opState`:

| Field | Meaning |
|---|---|
| `operationId` | Matches the `id` of the op in the job definition |
| `status`, `exitCode` | Outcome. Non-zero `exitCode` is your failure |
| `startTime`, `endTime` | Epoch ms; `endTime` null while running |
| `logs[]` | `{ type: 'stdin'|'stdout'|'stderr'|'nodeerr', log?, timestamp? }` |
| `results` | Values extracted by the op's `results` regexes |
| `error` | `{ event, message }` when the node itself failed |

`nodeerr` is the host reporting a problem (image pull failure, resource
download, OOM) as opposed to your container writing to stderr. Check it first
when a container never starts.

## Events, tasks, revisions, jobs

```ts
const { events }    = await deployment.getEvents();
const { tasks }     = await deployment.getTasks();
const { revisions } = await deployment.getRevisions();
const { jobs }      = await deployment.getJobs();
```

- **Event** — `{ category, deploymentId, type, message, tx?, created_at }`. The
  audit trail, and the only place a scheduling failure shows up. Observed
  types include `JOB_LIST_CONFIRMED`, `JOB_LIST_ERROR`, and
  `JOB_STOPPED_CONFIRMED` (which carries the stop `tx`). `tx` links to the
  Solana transaction.
- **Task** — scheduled work the manager still owes you: `LIST` (place a job),
  `EXTEND`, `STOP`, with `due_at` and `attempts`. Rising `attempts` means
  retries are failing.
- **Revision** — `{ revision, deployment, ipfs_definition_hash, job_definition }`.
- **Job** — `{ tx, deployment, job, market, node, revision, state, time_start }`.

### Pagination

Every listing accepts `{ cursor?, limit?: 10|20|50|100, sort_order?: 'asc'|'desc' }`
and returns `total_items` plus `nextPage()` / `previousPage()`, each `null` at
the boundary.

```ts
let page = await deployment.getEvents({ limit: 100, sort_order: 'desc' });
const all = [...page.events];
while (page.nextPage) {
  page = await page.nextPage();
  all.push(...page.events);
}
```

## Normalising job state

Three encodings exist for one enum. Normalise on read:

```ts
import { JobState } from '@nosana/kit'; // QUEUED=0 RUNNING=1 COMPLETED=2 STOPPED=3

const NAMES = ['QUEUED', 'RUNNING', 'COMPLETED', 'STOPPED'] as const;
const toName = (s: string | number) => (typeof s === 'number' ? NAMES[s] : s);
```

## Observed timings

From a live run: bare `nginx` on `nvidia-3060`, API-key auth, `autostart: true`.

| Transition | Elapsed |
|---|---|
| create → `STARTING`, `endpoints` already populated | immediate |
| `STARTING` → `RUNNING` | ~1s |
| job `QUEUED` → `RUNNING` on a host | ~3s |
| `RUNNING` → `online: true` | **21s, 35s, 80s and 216s** across four runs |
| `stop()` → `STOPPING` → `STOPPED` | ~2s |

The gap that matters is the last-but-one: for minutes the URL exists, the
deployment says `RUNNING`, and every request 503s. Anything treating `RUNNING`
or a populated `endpoints` array as readiness reports a false success there —
which is what `online` exists to tell you.

The gap is **highly variable**: the same job definition on the same market took
21s, 35s, 80s and 216s on different runs, depending which host picked it up and
whether the image was cached there. So wait on `online` rather than on a clock;
any timeout derived from one good run will flake.
