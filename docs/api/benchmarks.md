---
title: Benchmarks
---

# Benchmarks API

The Benchmarks API exposes the benchmark system that validates GPU hosts:
recent benchmark runs, per-market metric aggregates and thresholds, and the
metric/operation definitions behind them. It also contains the routes nodes
use to submit their benchmark results.

## Benchmark data

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// Recent benchmark runs across the network
const recent = await client.api.benchmarks.getRecent();

// Per-market metric aggregates
const aggregates = await client.api.benchmarks.getMarketMetricAggregates();

// Current benchmark version
const version = await client.api.benchmarks.getVersion();
```

| Method | HTTP | Path | Description |
|---|---|---|---|
| `benchmarks.getRecent()` | GET | `/benchmarks/recent` | Recent benchmarks |
| `benchmarks.getMarketMetricAggregates(query?)` | GET | `/benchmarks/market-metric-aggregates` | Per-market metric aggregates |
| `benchmarks.getVersion()` | GET | `/benchmarks/benchmark-version` | Current benchmark version |

## Thresholds & definitions

The thresholds a host must meet, and the definitions of the metrics and
operations they are computed from:

| Method | HTTP | Path | Description |
|---|---|---|---|
| `benchmarks.getThresholds(query?)` | GET | `/benchmarks/thresholds` | Benchmark thresholds |
| `benchmarks.getMarketThresholds(query?)` | GET | `/benchmarks/market-thresholds` | Per-market thresholds |
| `benchmarks.getMetrics(query?)` | GET | `/benchmarks/metrics` | Metric definitions |
| `benchmarks.getOperations()` | GET | `/benchmarks/operations` | Operation definitions |
| `benchmarks.getMetricProcessors()` | GET | `/benchmarks/metric-processors` | Metric processors |
| `benchmarks.getTemplatesConfig()` | GET | `/benchmark-templates/config` | Stored benchmark template config |
| `benchmarks.getTemplatesRefresh()` | GET | `/benchmark-templates/refresh` | Preview benchmark template diff |

## Node-facing routes

Used by the node software during benchmarking — you normally don't call these
unless you are building or operating a host:

| Method | HTTP | Path | Description |
|---|---|---|---|
| `benchmarks.getPrediction(id, body)` | POST | `/benchmarks/{id}/prediction` | Benchmark prediction for a node |
| `benchmarks.seed(id, body)` | POST | `/benchmarks/{id}/seed` | Seed a node benchmark |
| `benchmarks.submitResults(id, body)` | POST | `/benchmarks/{id}/submit-results` | Submit benchmark results |

Recent benchmark runs for one specific node are available on the
[Hosts API](/api/hosts) as `hosts.getRecentBenchmarks(id)`.
