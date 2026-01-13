---
title: Vault Management
---

# Vault Management

When using wallet authentication, each deployment has an associated vault that holds funds (SOL and NOS) for running jobs. Vaults allow you to manage deployment funding directly from your Solana wallet.

## Overview

Vaults are Solana accounts that hold SOL and NOS tokens used to pay for deployment execution. Each deployment created with wallet authentication automatically gets a vault, but you can also create and manage vaults independently.

## Getting Started

To use vault management, you need to authenticate with a wallet. See the [Wallet Authentication](/api/wallet-authentication) guide for setup instructions.

## Deployment Vaults

When you create a deployment with wallet authentication, it automatically includes a vault:

```ts
import { createNosanaClient } from '@nosana/kit';

const client = createNosanaClient({
  wallet: {
    // Your wallet configuration
  },
});

// Create a deployment with wallet authentication
const deployment = await client.deployments.create({
  name: 'My Deployment',
  market: 'CA5pMpqkYFKtme7K31pNB1s62X2SdhEv1nN9RdxKCpuQ',
  replicas: 1,
  timeout: 60,
  strategy: 'SIMPLE',
  job_definition: {
    // ... your job definition
  },
});

// The deployment includes a vault
console.log('Vault address:', deployment.vault.address);
```

## Vault Operations

### Get Vault Balance

Check the current balance of SOL and NOS in your vault:

:::tabs

== @nosana/kit

```ts
const balance = await deployment.vault.getBalance();
console.log(`SOL: ${balance.SOL}, NOS: ${balance.NOS}`);
```

:::

The balance is returned as an object with `SOL` and `NOS` properties, representing the amounts in each token.

**Note:** Getting vault balance is handled client-side using Solana RPC calls, not through a direct API endpoint.

### Top Up Vault

Add funds to your vault to pay for deployment execution. You can top up with SOL, NOS, or both:

:::tabs

== @nosana/kit

```ts
// Top up with NOS tokens
await deployment.vault.topup({
  NOS: 100, // Amount in NOS
});

// Top up with SOL
await deployment.vault.topup({
  SOL: 0.5, // Amount in SOL
});

// Top up with both
await deployment.vault.topup({
  SOL: 0.5,
  NOS: 100,
});
```

:::

The `topup` method transfers tokens from your wallet to the vault address. Make sure your wallet has sufficient balance before attempting to top up.

**Note:** Topping up a vault is handled client-side using Solana token transfers, not through a direct API endpoint.

### Withdraw from Vault

Withdraw all funds from a vault back to your wallet:

:::tabs

== @nosana/kit

```ts
await deployment.vault.withdraw();
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/deployments/vaults/{vault}/withdraw \
  -H "Authorization: NosanaApiAuthentication:<signed-message>" \
  -H "x-user-id: <your-public-key>" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "transaction": "base64-encoded-transaction"
}
```

The API returns a serialized transaction that must be signed and sent by your wallet.

:::

This operation:
1. Calls the API to generate a withdrawal transaction
2. Signs the transaction with your wallet
3. Sends and confirms the transaction on-chain
4. Transfers all SOL and NOS from the vault back to your wallet

## Managing Multiple Vaults

You can create and manage vaults independently of deployments:

### Create a Vault

:::tabs

== @nosana/kit

```ts
// Create a new vault
const vault = await client.deployments.vaults.create();

console.log('Vault address:', vault.address);
console.log('Created at:', vault.created_at);
```

== HTTP API

```bash
curl -X POST https://dashboard.k8s.prd.nos.ci/api/deployments/vaults/create \
  -H "Authorization: NosanaApiAuthentication:<signed-message>" \
  -H "x-user-id: <your-public-key>" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "vault": "vault-address-here"
}
```

:::

### List All Vaults

:::tabs

== @nosana/kit

```ts
// List all your vaults
const vaults = await client.deployments.vaults.list();

vaults.forEach(vault => {
  console.log(`Vault: ${vault.address}, Created: ${vault.created_at}`);
});
```

== HTTP API

```bash
curl -X GET https://dashboard.k8s.prd.nos.ci/api/deployments/vaults \
  -H "Authorization: NosanaApiAuthentication:<signed-message>" \
  -H "x-user-id: <your-public-key>"
```

**Response:**
```json
[
  {
    "vault": "vault-address-1",
    "created_at": "2024-01-01T00:00:00Z"
  },
  {
    "vault": "vault-address-2",
    "created_at": "2024-01-02T00:00:00Z"
  }
]
```

:::

### Use Vault Methods

Once you have a vault object, you can use all the same methods:

```ts
const vault = await client.deployments.vaults.create();

// Check balance
const balance = await vault.getBalance();

// Top up
await vault.topup({ NOS: 50 });

// Withdraw
await vault.withdraw();
```

## API Endpoints Summary

When using wallet authentication, you have access to these vault management endpoints:

| Operation | Endpoint | Method | Notes |
|-----------|----------|--------|-------|
| Create Vault | `/api/deployments/vaults/create` | POST | Returns vault address |
| List Vaults | `/api/deployments/vaults` | GET | Returns all your vaults |
| Withdraw | `/api/deployments/vaults/{vault}/withdraw` | POST | Returns transaction to sign |
| Get Balance | N/A | N/A | Client-side Solana RPC call |
| Top Up | N/A | N/A | Client-side token transfer |

**Note:** The `getBalance` and `topup` operations are handled client-side using Solana RPC calls and token transfers, not through direct API endpoints.

## Best Practices

1. **Monitor Vault Balance**: Regularly check your vault balance to ensure you have sufficient funds for deployments
2. **Top Up Before Running**: Add funds to your vault before starting deployments to avoid interruptions
3. **Withdraw Unused Funds**: Periodically withdraw unused funds from vaults back to your wallet
4. **Use Separate Vaults**: Consider creating separate vaults for different projects or environments
  
