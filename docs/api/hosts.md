---
title: Hosts
---

# Hosts API

The Hosts API provides information about the nodes (GPU hosts) on the Nosana
Network: discovery, specifications, metrics, uptime, and rewards. It also
contains the self-service routes node operators use to register and keep their
node in sync.

## Discovering hosts

```ts twoslash
declare const process: { env: Record<string, string> };
// ---cut---
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// List nodes (optionally filtered)
const nodes = await client.api.hosts.list();

// Node details: basic, full, or extended info
const node = await client.api.hosts.get('node-address');
const full = await client.api.hosts.getFull('node-address');
const info = await client.api.hosts.getInfo('node-address');

// What GPUs are available on the network right now?
const gpus = await client.api.hosts.getAvailableGpus();

// Node distribution by country
const byCountry = await client.api.hosts.getByCountry();
```

| Method | HTTP | Path | Description |
|---|---|---|---|
| `hosts.list(query?)` | GET | `/nodes/` | List nodes |
| `hosts.get(id)` | GET | `/nodes/{id}` | Get a node |
| `hosts.getFull(id)` | GET | `/nodes/{id}/full` | Full node info |
| `hosts.getInfo(id)` | GET | `/nodes/{id}/info` | Extended node info |
| `hosts.getAvailableGpus()` | GET | `/nodes/available-gpus` | Available GPUs |
| `hosts.getQueuedNodes(query?)` | GET | `/nodes/queued-nodes` | Queued nodes |
| `hosts.getWithAccess(query?)` | GET | `/nodes/with-access` | Nodes with market access |
| `hosts.getByCountry()` | GET | `/stats/nodes-country` | Node distribution by country |

## Metrics, uptime & rewards

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// Node metrics and uptime
const metrics = await client.api.hosts.getMetrics('node-address');
const uptime = await client.api.hosts.getUptime('node-address');

// Rewards: per node or network-wide
const nodeRewards = await client.api.hosts.getRewardsById('node-address');
const allRewards = await client.api.hosts.getRewards();

// Recent benchmark runs for a node
const benchmarks = await client.api.hosts.getRecentBenchmarks('node-address');
```

| Method | HTTP | Path | Description |
|---|---|---|---|
| `hosts.getMetrics(id, query?)` | GET | `/nodes/{id}/metrics` | Node metrics |
| `hosts.getUptime(node, query?)` | GET | `/nodes/heartbeats/uptime/{node}` | Node uptime |
| `hosts.getRewardsById(id)` | GET | `/nodes/{id}/rewards` | Rewards for one node |
| `hosts.getRewards()` | GET | `/nodes/rewards` | Global rewards |
| `hosts.getRecentBenchmarks(id)` | GET | `/nodes/{id}/recent-benchmarks` | Recent node benchmarks |

## Market assignment

Helpers around which market a node belongs to or should request:

| Method | HTTP | Path | Description |
|---|---|---|---|
| `hosts.getRequestMarket(query?)` | GET | `/nodes/request-market` | Market a node should request |
| `hosts.getMarketRelation(query?)` | GET | `/nodes/market-relation` | Node ↔ market relation |
| `hosts.getMinimumRequiredVersion(query?)` | GET | `/nodes/minimum-required-version` | Minimum required node version |

## Node-operator routes

These routes are used by the node software itself (registration, heartbeats,
metric reporting). You normally don't call them unless you are building or
operating a host:

| Method | HTTP | Path | Description |
|---|---|---|---|
| `hosts.register(body)` | POST | `/nodes/register` | Register a node |
| `hosts.syncNode(body)` | POST | `/nodes/sync-node` | Sync node state |
| `hosts.heartbeat(body)` | POST | `/nodes/heartbeat` | Send a heartbeat |
| `hosts.payment(body)` | POST | `/nodes/payment` | Node payment |
| `hosts.postMetrics(id, body)` | POST | `/nodes/{id}/metrics` | Report node metrics |
| `hosts.updateAddress(id, body)` | PATCH | `/nodes/{id}/address` | Update node address |
| `hosts.updateContact(id, body)` | PATCH | `/nodes/{id}/contact` | Update node contact info |

Interested in running a host yourself? See the
[Host GPUs guide](/hosts/grid).
