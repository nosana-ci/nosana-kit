---
title: Markets
---

# Markets API

The Markets API provides information about GPU markets available on the Nosana Network. Markets represent pools of GPU resources where jobs and deployments are scheduled.

## Overview

GPU Markets are collections of GPU hosts that offer compute resources. Each market has:
- Specific GPU types (e.g., NVIDIA RTX 3090, RTX 4090)
- Pricing information
- Resource requirements
- Availability status

Use the Markets API to:
- Discover available GPU markets
- Get market details and pricing
- Check required resources for a market
- Select the appropriate market for your workload

## List Markets

Get a list of all available markets:

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

// List all markets
const markets = await client.api.markets.list();

markets.forEach(market => {
  console.log(`Market: ${market.name}`);
  console.log(`Address: ${market.address}`);
  console.log(`Type: ${market.type}`);
});
```

== HTTP API

```bash
curl -X GET https://dashboard.k8s.prd.nos.ci/api/markets/ \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

**Response:**
```json
[
  {
    "address": "CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ",
    "name": "NVIDIA RTX 3090",
    "type": "PREMIUM",
    "gpu": "RTX 3090",
    "vram": 24,
    "price_per_hour_usd": 0.5
  }
]
```

:::

## Get Market Details

Get detailed information about a specific market:

:::tabs

== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// Get market by address
const market = await client.api.markets.get('CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ');

console.log('Market Name:', market.name);
console.log('GPU Type:', market.gpu);
console.log('VRAM:', market.vram);
console.log('Price per Hour:', market.price_per_hour_usd);
```

== HTTP API

```bash
curl -X GET https://dashboard.k8s.prd.nos.ci/api/markets/{id}/ \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

:::

## Get Required Resources

Check the resource requirements for a specific market:

:::tabs

== @nosana/kit

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// Get required resources for a market
const resources = await client.api.markets.getRequiredResources(
  'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ'
);

console.log('Required VRAM:', resources.required_vram);
console.log('Required CPU:', resources.required_cpu);
console.log('Required Memory:', resources.required_memory);
```

== HTTP API

```bash
curl -X GET https://dashboard.k8s.prd.nos.ci/api/markets/{id}/required-resources \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

**Response:**
```json
{
  "required_vram": 24,
  "required_cpu": 4,
  "required_memory": 16
}
```

:::

## Pricing, Docker Images & Remote Resources

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
declare const id: string;
// ---cut---
// Pricing
const prices = await client.api.markets.getPrices(); // all market prices
const nosPrice = await client.api.markets.getPrice(); // current NOS price (USD)

// Docker images
const images = await client.api.markets.getDockerImages();
const image = await client.api.markets.getDockerImage(id);

// Remote resources
const resources = await client.api.markets.getRemoteResources();
const resource = await client.api.markets.getRemoteResource(id);
```

| Method | HTTP | Path | Description |
|---|---|---|---|
| `markets.getPrices()` | GET | `/api/markets/prices` | All market prices |
| `markets.getPrice()` | GET | `/api/markets/price` | Current NOS token price (USD) |
| `markets.getDockerImages()` | GET | `/api/markets/docker-images` | List Docker images |
| `markets.getDockerImage(id)` | GET | `/api/markets/docker-images/{id}` | Get a Docker image |
| `markets.getRemoteResources()` | GET | `/api/markets/remote-resources` | List remote resources |
| `markets.getRemoteResource(id)` | GET | `/api/markets/remote-resources/{id}` | Get a remote resource |

## Market Types

Markets can be categorized into different types:

- **PREMIUM**: Validated, high-performance GPU markets
- **COMMUNITY**: New or unvalidated GPU markets

## Selecting a Market

When creating a deployment, you need to specify a market. Consider:

1. **GPU Requirements**: Match your workload's GPU needs (VRAM, compute capability)
2. **Pricing**: Compare prices across markets
3. **Availability**: Check market availability and queue lengths
4. **Resource Requirements**: Ensure your job definition matches the market's required resources

## Example: Finding the Right Market

```ts twoslash
import { createNosanaClient, NosanaNetwork } from '@nosana/kit';
declare const process: { env: Record<string, string> };
const client = createNosanaClient(NosanaNetwork.MAINNET, {
  api: { apiKey: process.env.NOSANA_API_KEY },
});
// ---cut---
// List all markets
const markets = await client.api.markets.list();

// Filter for markets with sufficient VRAM
const suitableMarkets = markets.filter(
  (market) => Number(market.vram) >= 24, // Need at least 24GB VRAM
);

// Get detailed requirements for each
for (const market of suitableMarkets) {
  const resources = await client.api.markets.getRequiredResources(String(market.address));
  console.log(`${market.name}: ${resources.required_vram}GB VRAM required`);
}

// Select the most cost-effective option
const selectedMarket = suitableMarkets.sort(
  (a, b) => Number(a.price_per_hour_usd) - Number(b.price_per_hour_usd),
)[0];
```
