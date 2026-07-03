---
title: Stats
---

# Stats API

The Stats API exposes aggregated network statistics from the Blockchain
Indexer: overall network numbers, the NOS token price, and per-account
spending and earning history.

## Usage

```ts
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';

const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});

// Latest aggregated network statistics
const stats = await client.api.stats.get();

// NOS token price (optionally for a specific date or timestamp)
const price = await client.api.stats.getPrice();
const historic = await client.api.stats.getPrice({ date: '2025-06-01' });

// Spending history over a custom date range
const spending = await client.api.stats.getSpendingHistory({
  start_date: '2025-01-01',
  end_date: '2025-06-30',
});

// Node earning history
const earnings = await client.api.stats.getEarningHistory({
  start_date: '2025-01-01',
});
```

## Methods

| Method | HTTP | Path | Description |
|---|---|---|---|
| `stats.get()` | GET | `/stats/` | Latest aggregated statistics |
| `stats.getPrice(query?)` | GET | `/stats/price` | NOS price for a date or timestamp |
| `stats.getSpendingHistory(request)` | GET | `/stats/spending-history` | Spending history over a date range |
| `stats.getEarningHistory(request)` | GET | `/stats/earning-history` | Node earning history over a date range |

Job-specific statistics (counts, GPU compute hours over time) live on the
[Jobs API](/api/jobs) as `jobs.getStats()`, `jobs.getStatsTimestamps()`, and
`jobs.getStatsTimestampsHours()`.
