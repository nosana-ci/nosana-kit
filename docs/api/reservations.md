---
title: GPUs & Requirements
---

# GPUs & Requirements API

The `reservations` group answers the questions you ask before posting a
deployment: which GPUs exist on the network, which hardware requirements you
can set, and how many hosts meet them right now. It is what the dashboard uses
to pick a GPU and narrow the hosts a deployment may run on.

All three calls are read-only and need no authentication. Reserving hosts
for a deployment is done by the deployment manager, not through this group.

## Requirements

A requirement set maps a metric key to a value:

- **A number is a minimum.** `ram_gb: 64` means at least 64 GB of RAM.
- **A string or boolean must match exactly.** `country: "NL"` means hosts in the Netherlands.
- **The GPU model is the `name` key.** For example, `name: "NVIDIA GeForce RTX 4090"`.

```ts
const requirements = {
  name: 'NVIDIA GeForce RTX 4090',
  ram_gb: 64,
  country: 'NL',
};
```

## List GPU models

Every GPU model on the network, with its VRAM, how many hosts have one, how
many of those are queued and free right now, how many are running a job, and
the markets they serve.

::: tabs
== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET);

const { gpus } = await client.api.reservations.listGpus();

for (const gpu of gpus) {
  console.log(gpu.name, `${gpu.vramGb} GB`, `${gpu.available} available`);
}
```

== HTTP API

```bash
curl https://api.nosana.com/reservations/gpus
```

:::

## Requirement options

For each requirement metric: its type, whether it matches as a minimum or
exactly, and the values hosts report with how many hosts report each. Pass
`requirements` to describe only the hosts that already meet them, which is how
the options narrow as you pick a GPU. Omit `metrics` to get every metric.

::: tabs
== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET);

// RAM and CUDA options among RTX 4090 hosts
const options = await client.api.reservations.getRequirementOptions({
  metrics: ['ram_gb', 'cuda_driver_version'],
  requirements: { name: 'NVIDIA GeForce RTX 4090' },
});

console.log(`${options.nodes} hosts in scope`);
for (const metric of options.metrics) {
  console.log(metric.key, metric.match, metric.values.length);
}
```

== HTTP API

```bash
curl -X POST https://api.nosana.com/reservations/requirements \
  -H "Content-Type: application/json" \
  -d '{"metrics":["ram_gb","cuda_driver_version"],"requirements":{"name":"NVIDIA GeForce RTX 4090"}}'
```

:::

## Find available hosts

The queued hosts, across every market, that meet a requirement set right now,
with the hourly price range of the markets they are in. Prices are the base
reward per hour, before the network fee.

::: tabs
== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET);

const available = await client.api.reservations.findAvailable({
  requirements: { name: 'NVIDIA GeForce RTX 4090', ram_gb: 64 },
});

console.log(`${available.total} hosts available now`);
if (available.price) {
  console.log(`$${available.price.minUsdPerHour}/h and up`);
}
```

== HTTP API

```bash
curl -X POST https://api.nosana.com/reservations/available \
  -H "Content-Type: application/json" \
  -d '{"requirements":{"name":"NVIDIA GeForce RTX 4090","ram_gb":64}}'
```

:::

## Reference

| Method | HTTP | Path | Description |
|---|---|---|---|
| `reservations.listGpus()` | GET | `/reservations/gpus` | GPU models with host counts and markets |
| `reservations.getRequirementOptions(request?)` | POST | `/reservations/requirements` | Requirement metrics and their values, scoped by requirements |
| `reservations.findAvailable(request?)` | POST | `/reservations/available` | Queued hosts meeting requirements, with the price range |

`GET /reservations/requirements?metrics=ram_gb,country` returns the same
options without a requirement scope, for callers that prefer a query string.

## Errors

- **422:** a requirement names an unknown metric, or its value has the wrong type.
- **503:** host-manager cannot reach the blockchain indexer it reads queues from. Retry later.

The SDK throws a `NosanaApiError` carrying the status code in both cases.
