---
title: Credits
---

# Credits API

The Credits API allows you to check your account's credit balance. Credits are used to pay for deployments when using API key authentication.

## Overview

Credits are the currency used in the Nosana Network when using API key authentication. Each deployment execution consumes credits based on the resources used and execution time.

## Get Credit Balance

Check your current credit balance:

:::tabs

== @nosana/kit

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  api: {
    apiKey: process.env.NOSANA_API_KEY,
  },
});

// Get credit balance
const balance = await client.api.credits.balance();

console.log('Assigned Credits:', balance.assignedCredits);
console.log('Reserved Credits:', balance.reservedCredits);
console.log('Settled Credits:', balance.settledCredits);
console.log('Available Credits:', balance.assignedCredits - balance.reservedCredits - balance.settledCredits);
```

== HTTP API

```bash
curl -X GET https://dashboard.k8s.prd.nos.ci/api/credits/balance \
  -H "Authorization: Bearer nos_xxx_your_api_key"
```

**Response:**
```json
{
  "assignedCredits": 1000.0,
  "reservedCredits": 50.0,
  "settledCredits": 200.0
}
```

:::

## Balance Fields

| Field | Description |
|-------|-------------|
| `assignedCredits` | Total credits assigned to your account |
| `reservedCredits` | Credits currently reserved for running deployments |
| `settledCredits` | Credits that have been consumed by completed deployments |
| Available Credits | `assignedCredits - reservedCredits - settledCredits` |

## Understanding Credit Usage

- **Reserved Credits**: Credits that are currently allocated to active deployments. These credits are held until the deployment completes or is stopped.
- **Settled Credits**: Credits that have been consumed by completed deployments. These are permanently deducted from your balance.
- **Available Credits**: The amount of credits you can use for new deployments. This is calculated as `assignedCredits - reservedCredits - settledCredits`.

## Insufficient Credits

If you don't have enough available credits, deployments will fail with an `INSUFFICIENT_FUNDS` status. You can:

1. Check your balance using this API
2. Top up your account through the [Nosana Deploy dashboard](https://deploy.nosana.com)
3. Wait for running deployments to complete and release reserved credits

