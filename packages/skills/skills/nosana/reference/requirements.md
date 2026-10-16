# GPUs & Requirements

A deployment says what its hosts must have through `requirements`, and the
network reserves matching hosts for every job it lists. Pin a `market` as well
and every job goes there; leave it out and each job goes to the cheapest
`PREMIUM` market with a free host that meets the requirements.

The three lookups below live on `client.api.reservations`. They are read-only,
need no authentication, and are what the Nosana dashboard uses to build its GPU
picker — use them instead of guessing GPU names or market addresses.

## Requirement values

```ts
const requirements = {
  name: ['NVIDIA GeForce RTX 4090', 'NVIDIA GeForce RTX 5090'], // any of these GPUs
  ram_gb: 64,            // at least 64 GB
  cuda_driver_version: '12.8',
  country: 'NL',
};
```

| Value | Meaning |
|---|---|
| number | a minimum: `ram_gb: 64` is 64 GB or more |
| string or boolean | an exact match: `country: 'NL'` |
| list | any of its values: `name: [...]` accepts hosts with either GPU |

Each metric declares its own `match` rule (`minimum` or `exact`), which
`getRequirementOptions()` reports; the table above is the default by type. The
GPU model is the `name` key, spelled exactly as hosts report it (vendor and all).

## Which GPUs exist

```ts
const { gpus } = await client.api.reservations.listGpus();

for (const gpu of gpus) {
  // `available` hosts are queued now; `working` ones come back as jobs finish
  console.log(gpu.name, `${gpu.vramGb} GB`, gpu.available, 'free of', gpu.nodes);
  // hourly USD across its open markets, before the network fee; null when unpriced
  if (gpu.price) console.log(`  $${gpu.price.minUsdPerHour}–$${gpu.price.maxUsdPerHour}/h`);
}
```

One entry per model and VRAM size, as a deployment without a market sees the
network: only hosts in open markets count, and `price` is what an hour there
costs, so there is no need to read the markets list. Use the `name` verbatim as
the `name` requirement.

## Which requirements you can set

```ts
// Every usable metric, over every host
const all = await client.api.reservations.getRequirementOptions();

// RAM and CUDA among RTX 4090 hosts only, so no option is one no such host meets
const scoped = await client.api.reservations.getRequirementOptions({
  metrics: ['ram_gb', 'cuda_driver_version'],
  requirements: { name: 'NVIDIA GeForce RTX 4090' },
});

console.log(`${scoped.nodes} hosts in scope`);
for (const metric of scoped.metrics) {
  console.log(metric.key, metric.type, metric.match, metric.min, metric.max);
  for (const { value, nodes } of metric.values) console.log(' ', value, nodes);
}
```

Each metric comes with its type, match rule, the distinct values hosts report
and how many hosts report each, and `min`/`max` for numbers. Common keys on
mainnet (verify with the call — the set is data, not schema):

| Key | Match | Example |
|---|---|---|
| `name` | exact | `'NVIDIA GeForce RTX 4090'` |
| `vram_total_mb` | minimum | `24000` |
| `cuda_driver_version` | exact | `'12.8'` |
| `ram_gb` | minimum | `64` |
| `disk_gb` | minimum | `500` |
| `logical_cores`, `physical_cores` | minimum | `16` |
| `cpu_model` | exact | `'AMD EPYC 7543 32-Core Processor'` |
| `country`, `region` | exact | `'NL'`, `'Europe'` |
| `download_mbps`, `upload_mbps`, `ping_ms` | per metric | `1000` |
| `CC` | exact | `true` — confidential-compute capable |

Unknown keys and wrongly typed values are rejected with **422** when the
deployment's jobs are reserved, so stick to keys the options call returns.

## Who is free right now, and at what price

```ts
const available = await client.api.reservations.findAvailable({
  requirements: { name: 'NVIDIA GeForce RTX 4090', ram_gb: 64 },
});

console.log(`${available.total} hosts queued now`);
for (const node of available.nodes) console.log(node.nodeAddress, 'in market', node.market);
if (available.price) {
  // base USD per hour across those hosts' markets, before the network fee
  console.log(`$${available.price.minUsdPerHour}–$${available.price.maxUsdPerHour}/h`);
}
```

A dry run of the reservation: the queued hosts, across every market, that meet
the requirements, in queue order. `total: 0` means a deployment with these
requirements would wait for a host to free up — loosen them (more GPUs in the
`name` list, a lower minimum) and check again. The price range is what the
markets those hosts are in pay per hour; market `usd_reward_per_hour` (see
[markets.md](markets.md)) is the same figure per market.

## Using them on a deployment

```ts
// Create: any of two GPUs, no market — cheapest premium host first
const deployment = await client.api.deployments.create({
  name: 'my-service',
  requirements: { name: ['NVIDIA GeForce RTX 4090', 'NVIDIA GeForce RTX 5090'], ram_gb: 32 },
  replicas: 1,
  timeout: 60,
  strategy: 'SIMPLE',
  autostart: true,
  job_definition: jobDefinition,
});

// Later: change them. Running jobs keep their hosts; new and replacement jobs
// are reserved on hosts that meet the new set.
await deployment.updateRequirements({ name: ['NVIDIA GeForce RTX 5090'], ram_gb: 64 });

// Pin one market instead (the second argument). A RUNNING deployment's jobs
// are relisted on it, as with updateMarket.
await deployment.updateRequirements({ name: 'NVIDIA GeForce RTX 5090' }, marketAddress);

// Clear them: any host in the pinned market, or any premium host without one
await deployment.updateRequirements(null);
```

`deployment.market` is `null` on a deployment that posts across markets, and
`deployment.requirements` is `null` when none are set. The job's actual market
is on each job (`getJobs()` → `jobs[].market`).

## Errors

- **422** — a requirement names a metric the options call does not list, or its value has the wrong type.
- **503** — host-manager cannot reach the indexer it reads host queues from. Retry.
